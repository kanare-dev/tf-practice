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

# ========================================
# Environment Module
# ========================================

module "note_app_environment" {
  source = "../../modules/environment"

  # 環境設定
  env             = var.env
  domain_name     = var.domain_name
  api_domain_name = var.api_domain_name

  # AWS設定
  aws_region = var.aws_region

  # Cloudflare DNS設定
  enable_cloudflare_dns = var.enable_cloudflare_dns
  cloudflare_api_token  = var.cloudflare_api_token
  cloudflare_zone_id    = var.cloudflare_zone_id

  providers = {
    aws.useast1 = aws.useast1
  }
}
