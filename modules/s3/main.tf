terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3バケット（静的Webサイトホスティング用）
resource "aws_s3_bucket" "web_app" {
  bucket = var.bucket_name

  tags = var.tags
}

# バケットバージョニング
resource "aws_s3_bucket_versioning" "web_app" {
  bucket = aws_s3_bucket.web_app.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# バケットのパブリックアクセス設定
resource "aws_s3_bucket_public_access_block" "web_app" {
  bucket = aws_s3_bucket.web_app.id

  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets
}

# 静的Webサイトホスティング設定
resource "aws_s3_bucket_website_configuration" "web_app" {
  count  = var.enable_static_hosting ? 1 : 0
  bucket = aws_s3_bucket.web_app.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# バケットポリシー（静的ホスティングの場合）
resource "aws_s3_bucket_policy" "web_app" {
  count  = var.enable_static_hosting && !var.restrict_public_buckets ? 1 : 0
  bucket = aws_s3_bucket.web_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.web_app.arn}/*"
      }
    ]
  })
}

# Lambdaデプロイパッケージ用のS3バケット
resource "aws_s3_bucket" "lambda_deployments" {
  count  = var.create_lambda_deployment_bucket ? 1 : 0
  bucket = "${var.bucket_name}-lambda-deployments"

  tags = var.tags
}

resource "aws_s3_bucket_versioning" "lambda_deployments" {
  count  = var.create_lambda_deployment_bucket ? 1 : 0
  bucket = aws_s3_bucket.lambda_deployments[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

