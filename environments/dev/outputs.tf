output "s3_bucket_id" {
  description = "S3バケットID（静的ファイル用）"
  value       = module.s3.bucket_id
}

output "s3_website_endpoint" {
  description = "S3静的Webサイトホスティングのエンドポイント"
  value       = module.s3.website_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDBテーブル名"
  value       = module.dynamodb.table_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "api_gateway_url" {
  description = "API GatewayのURL"
  value       = module.api_gateway.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_id
}

output "lambda_function_name" {
  description = "Lambda関数名"
  value       = module.api_lambda.function_name
}

