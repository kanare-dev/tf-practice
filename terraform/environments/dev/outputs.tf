output "s3_bucket_id" {
  description = "S3バケットID"
  value       = module.s3_static_web.bucket_id
}

output "s3_website_endpoint" {
  description = "S3静的Webサイトのエンドポイント"
  value       = module.s3_static_web.website_endpoint
}

output "acm_dns_validation_options" {
  description = "ACM証明書バリデーション用DNS情報 (CNAME)"
  value       = aws_acm_certificate.note_app_cert.domain_validation_options
}

output "cloudfront_domain_name" {
  description = "CloudFront ドメイン (CNAMEエイリアスポイント)"
  value       = aws_cloudfront_distribution.note_app.domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.invoke_url
}

output "api_gateway_usage_plan_id" {
  description = "API Gateway Usage Plan ID (レート制限)"
  value       = module.api_gateway.usage_plan_id
}

output "api_key_value" {
  description = "API Key (レート制限が有効な場合のみ、terraform output api_key_value で確認可能)"
  value       = module.api_gateway.api_key_value
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = module.notes_table.table_name
}
