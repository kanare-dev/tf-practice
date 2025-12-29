variable "env" {
  description = "Environment name (prod or dev)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the environment"
  type        = string
}

variable "api_domain_name" {
  description = "API domain name for the environment"
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "ap-northeast-1"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token for managing DNS records"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for kanare.dev domain"
  type        = string
  default     = ""
}

variable "enable_cloudflare_dns" {
  description = "Enable Cloudflare DNS management via Terraform (requires cloudflare_api_token and cloudflare_zone_id)"
  type        = bool
  default     = false
}
