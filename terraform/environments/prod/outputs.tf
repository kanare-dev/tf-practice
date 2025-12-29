output "s3_bucket_id" {
  description = "S3バケットID"
  value       = module.note_app_environment.s3_bucket_id
}

output "s3_website_endpoint" {
  description = "S3静的Webサイトのエンドポイント"
  value       = module.note_app_environment.s3_website_endpoint
}

output "acm_dns_validation_options" {
  description = "ACM証明書バリデーション用DNS情報 (CNAME)"
  value       = module.note_app_environment.acm_dns_validation_options
}

output "cloudfront_domain_name" {
  description = "CloudFront ドメイン (CNAMEエイリアスポイント)"
  value       = module.note_app_environment.cloudfront_domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.note_app_environment.api_gateway_url
}

output "api_gateway_usage_plan_id" {
  description = "API Gateway Usage Plan ID (レート制限)"
  value       = module.note_app_environment.api_gateway_usage_plan_id
}

output "api_key_value" {
  description = "API Key (レート制限が有効な場合のみ、terraform output api_key_value で確認可能)"
  value       = module.note_app_environment.api_key_value
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = module.note_app_environment.dynamodb_table_name
}

# Cognito
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.note_app_environment.cognito_user_pool_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.note_app_environment.cognito_user_pool_arn
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID (フロントエンドで使用)"
  value       = module.note_app_environment.cognito_user_pool_client_id
}

output "api_custom_domain_target" {
  description = "API Gatewayカスタムドメイン向けCNAME先"
  value       = module.note_app_environment.api_custom_domain_target
}
