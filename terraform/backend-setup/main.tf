# Terraform State管理用のS3バケットとDynamoDBテーブルを作成
# 注意: このディレクトリは1回のみ実行し、その後は通常触りません

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

# Terraform State用S3バケット
resource "aws_s3_bucket" "terraform_state" {
  bucket = "kanare-terraform-state-bucket"

  tags = {
    Name      = "Terraform State Bucket"
    Purpose   = "terraform-state"
    ManagedBy = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# State Lock用DynamoDBテーブル
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = "Terraform State Locks"
    Purpose   = "terraform-state-lock"
    ManagedBy = "terraform"
  }
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.bucket
  description = "Terraform State用S3バケット名"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "Terraform State Lock用DynamoDBテーブル名"
}

output "next_steps" {
  value = <<-EOT

  Backend setup complete! Next steps:

  1. Use these values in your environment backend configurations:
     - S3 Bucket: ${aws_s3_bucket.terraform_state.bucket}
     - DynamoDB Table: ${aws_dynamodb_table.terraform_locks.name}
     - Region: ap-northeast-1

  2. Navigate to prod environment and run 'terraform init -migrate-state'
  3. Navigate to dev environment and run 'terraform init'
  EOT
}
