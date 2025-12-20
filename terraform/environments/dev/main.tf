terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
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
  source                = "../../modules/lambda"
  function_name         = "note-api-handler-dev"
  source_file           = "${path.root}/../../lambda-functions/api-handler.py"
  handler               = "api-handler.handler"
  runtime               = "python3.11"
  environment_variables = {}
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
  tags = {
    Name   = "dev-tfpractice-apigw"
    system = "tfpractice"
    env    = "dev"
  }
}
