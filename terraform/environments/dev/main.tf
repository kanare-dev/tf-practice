terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "useast1"
  region = "us-east-1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "random_id" "suffix" {
  byte_length = 4
}

module "s3_static_web" {
  source                          = "../../modules/s3"
  bucket_name                     = "note-app.kanare.dev"
  enable_static_hosting           = true
  block_public_acls               = false
  block_public_policy             = false
  ignore_public_acls              = false
  restrict_public_buckets         = false
  create_lambda_deployment_bucket = false
  tags = {
    Name   = "dev-tfpractice-s3-web"
    system = "tfpractice"
    env    = "dev"
  }
}

resource "aws_acm_certificate" "note_app_cert" {
  provider                  = aws.useast1
  domain_name               = "note-app.kanare.dev"
  validation_method         = "DNS"
  subject_alternative_names = []
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "note_app_cert_validation" {
  provider                = aws.useast1
  certificate_arn         = aws_acm_certificate.note_app_cert.arn
  validation_record_fqdns = [] # 手動バリデーションの場合は空配列、outputsで表示
}

resource "aws_cloudfront_distribution" "note_app" {
  depends_on      = [aws_acm_certificate_validation.note_app_cert_validation]
  enabled         = true
  is_ipv6_enabled = true
  comment         = "note-app.kanare.dev static site"
  aliases         = ["note-app.kanare.dev"]
  origin {
    domain_name = module.s3_static_web.website_endpoint
    origin_id   = "S3-note-app-static"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # S3 WebsiteEndpoint 必須
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-note-app-static"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_200"
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.note_app_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
  tags = {
    Name   = "dev-tfpractice-cloudfront"
    system = "tfpractice"
    env    = "dev"
  }
}

module "lambda_api_handler" {
  source        = "../../modules/lambda"
  function_name = "note-api-handler-dev"
  source_file   = "${path.root}/../../lambda-functions/api-handler.py"
  handler       = "api-handler.handler"
  runtime       = "python3.11"
  environment_variables = {
    DYNAMODB_TABLE = module.notes_table.table_name
  }
  additional_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = module.notes_table.table_arn
      }
    ]
  })
  tags = {
    Name   = "dev-tfpractice-lambda-api"
    system = "tfpractice"
    env    = "dev"
  }
}

module "api_gateway" {
  source               = "../../modules/api-gateway"
  api_name             = "note-api-gateway-dev"
  api_description      = "Notes CRUD API"
  lambda_invoke_arn    = module.lambda_api_handler.function_invoke_arn
  lambda_function_name = module.lambda_api_handler.function_name
  authorization_type   = "NONE"

  # レート制限設定を有効化
  enable_throttling    = true
  throttle_burst_limit = 100   # バースト時の最大リクエスト数
  throttle_rate_limit  = 50    # 1秒あたりの平均リクエスト数
  quota_limit          = 10000 # 1日あたりの最大リクエスト数
  quota_period         = "DAY"

  tags = {
    Name   = "dev-tfpractice-apigw"
    system = "tfpractice"
    env    = "dev"
  }
}

# API Gateway用ACM証明書（us-east-1必須）
resource "aws_acm_certificate" "api_custom" {
  provider          = aws.useast1
  domain_name       = "api.note-app.kanare.dev"
  validation_method = "DNS"
}

# API Gatewayカスタムドメイン
resource "aws_api_gateway_domain_name" "api_custom" {
  domain_name     = "api.note-app.kanare.dev"
  certificate_arn = aws_acm_certificate.api_custom.arn
  endpoint_configuration {
    types = ["EDGE"]
  }
}

# API Gateway パスマッピング（ルートに割り当て例）
resource "aws_api_gateway_base_path_mapping" "api_mapping" {
  domain_name = aws_api_gateway_domain_name.api_custom.domain_name
  api_id      = module.api_gateway.api_id
  stage_name  = "dev"
}

output "api_custom_domain_target" {
  value       = aws_api_gateway_domain_name.api_custom.cloudfront_domain_name
  description = "API Gatewayカスタムドメイン向けCNAME先"
}

# ========================================
# Cloudflare DNS Records
# ========================================

# ACM証明書検証レコード（note-app用）
resource "cloudflare_record" "acm_validation_note_app" {
  count = var.enable_cloudflare_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = tolist(aws_acm_certificate.note_app_cert.domain_validation_options)[0].resource_record_name
  value   = trimsuffix(tolist(aws_acm_certificate.note_app_cert.domain_validation_options)[0].resource_record_value, ".")
  type    = "CNAME"
  proxied = false # DNS only
  comment = "ACM certificate validation for note-app.kanare.dev"
}

# ACM証明書検証レコード（api.note-app用）
resource "cloudflare_record" "acm_validation_api" {
  count = var.enable_cloudflare_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = tolist(aws_acm_certificate.api_custom.domain_validation_options)[0].resource_record_name
  value   = trimsuffix(tolist(aws_acm_certificate.api_custom.domain_validation_options)[0].resource_record_value, ".")
  type    = "CNAME"
  proxied = false # DNS only
  comment = "ACM certificate validation for api.note-app.kanare.dev"
}

# CloudFront（静的サイト）向けCNAMEレコード
resource "cloudflare_record" "note_app" {
  count = var.enable_cloudflare_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "note-app"
  value   = aws_cloudfront_distribution.note_app.domain_name
  type    = "CNAME"
  proxied = false # DNS only
  comment = "CloudFront distribution for note-app static site"
}

# API Gateway向けCNAMEレコード
resource "cloudflare_record" "api_note_app" {
  count = var.enable_cloudflare_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "api.note-app"
  value   = aws_api_gateway_domain_name.api_custom.cloudfront_domain_name
  type    = "CNAME"
  proxied = false # DNS only
  comment = "API Gateway custom domain"
}

# ACM証明書の検証（Cloudflare DNSレコードに依存）
resource "aws_acm_certificate_validation" "note_app_cert_validation_with_cloudflare" {
  count = var.enable_cloudflare_dns ? 1 : 0

  provider        = aws.useast1
  certificate_arn = aws_acm_certificate.note_app_cert.arn
  validation_record_fqdns = [
    cloudflare_record.acm_validation_note_app[0].hostname
  ]

  depends_on = [cloudflare_record.acm_validation_note_app]
}

resource "aws_acm_certificate_validation" "api_cert_validation_with_cloudflare" {
  count = var.enable_cloudflare_dns ? 1 : 0

  provider        = aws.useast1
  certificate_arn = aws_acm_certificate.api_custom.arn
  validation_record_fqdns = [
    cloudflare_record.acm_validation_api[0].hostname
  ]

  depends_on = [cloudflare_record.acm_validation_api]
}

module "notes_table" {
  source                        = "../../modules/dynamodb"
  table_name                    = "NotesTable-dev"
  hash_key                      = "userId"
  hash_key_type                 = "S"
  range_key                     = "noteId"
  range_key_type                = "S"
  billing_mode                  = "PAY_PER_REQUEST"
  enable_point_in_time_recovery = true
  tags = {
    Name   = "dev-tfpractice-dynamodb-notes"
    system = "tfpractice"
    env    = "dev"
  }
}
