terraform {
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
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = var.source_file
  output_path = "${path.module}/.terraform/${var.function_name}.zip"
}

# Lambda関数
resource "aws_lambda_function" "main" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_role.arn
  handler       = var.handler
  runtime       = var.runtime

  # デプロイパッケージのソース
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # 環境変数
  environment {
    variables = var.environment_variables
  }

  # タイムアウトとメモリ
  timeout     = var.timeout
  memory_size = var.memory_size

  # デッドレターキュー
  dead_letter_config {
    target_arn = var.dead_letter_queue_arn != null ? var.dead_letter_queue_arn : null
  }

  tags = var.tags
}

# Lambda関数のIAMロール
resource "aws_iam_role" "lambda_role" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda実行ログの権限
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 追加のIAMポリシー（DynamoDB、S3などへのアクセス）
resource "aws_iam_role_policy" "lambda_additional_policy" {
  count  = var.additional_policy_json != null ? 1 : 0
  name   = "${var.function_name}-additional-policy"
  role   = aws_iam_role.lambda_role.id
  policy = var.additional_policy_json
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

