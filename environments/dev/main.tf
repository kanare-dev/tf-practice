terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2"
    }
  }

  backend "s3" {
    # 実際の環境では、バックエンド用のS3バケットとDynamoDBテーブルを設定してください
    # bucket = "your-terraform-state-bucket"
    # key    = "dev/terraform.tfstate"
    # region = "ap-northeast-1"
    # dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "tf-practice"
      ManagedBy   = "Terraform"
    }
  }
}

# 共通タグ
locals {
  common_tags = {
    Environment = "dev"
    Project     = "tf-practice"
    ManagedBy   = "Terraform"
  }
}

# S3モジュール（静的ファイルホスティング）
module "s3" {
  source = "../../modules/s3"

  bucket_name                  = "${var.project_name}-web-app-${var.aws_region}"
  enable_versioning            = true
  enable_static_hosting        = true
  block_public_acls            = false
  block_public_policy          = false
  ignore_public_acls           = false
  restrict_public_buckets      = false
  create_lambda_deployment_bucket = true

  tags = local.common_tags
}

# DynamoDBモジュール（データ永続化）
module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name                   = "${var.project_name}-users"
  hash_key                     = "userId"
  hash_key_type                = "S"
  billing_mode                 = "PAY_PER_REQUEST"
  enable_point_in_time_recovery = true

  tags = local.common_tags
}

# Cognitoモジュール（認証）
module "cognito" {
  source = "../../modules/cognito"

  user_pool_name = "${var.project_name}-user-pool"
  user_pool_client_name = "${var.project_name}-client"

  callback_urls = [
    "http://localhost:3000",
    module.s3.website_endpoint != null ? "http://${module.s3.website_endpoint}" : ""
  ]

  tags = local.common_tags
}

# Lambda関数用のIAMポリシー（DynamoDBアクセス）
data "aws_iam_policy_document" "lambda_dynamodb_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      module.dynamodb.table_arn
    ]
  }
}

# Lambda関数（サンプルAPI）
module "api_lambda" {
  source = "../../modules/lambda"

  function_name = "${var.project_name}-api-handler"
  source_file   = "${path.module}/../../lambda-functions/api-handler.py"
  handler       = "api-handler.handler"
  runtime       = "python3.11"
  timeout       = 10
  memory_size   = 256

  environment_variables = {
    DYNAMODB_TABLE = module.dynamodb.table_name
    USER_POOL_ID   = module.cognito.user_pool_id
  }

  additional_policy_json = data.aws_iam_policy_document.lambda_dynamodb_policy.json

  tags = local.common_tags
}

# API Gatewayモジュール
module "api_gateway" {
  source = "../../modules/api-gateway"

  api_name            = "${var.project_name}-api"
  api_description     = "MVP API Gateway for web application"
  stage_name          = "dev"
  lambda_invoke_arn   = module.api_lambda.function_invoke_arn
  lambda_function_name = module.api_lambda.function_name
  authorization_type  = "NONE"  # MVPでは認証なし、後でCognito統合

  tags = local.common_tags
}

