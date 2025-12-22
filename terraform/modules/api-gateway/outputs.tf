output "api_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_arn" {
  description = "API Gateway ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

output "invoke_url" {
  description = "API Gatewayの呼び出しURL"
  value       = "${aws_api_gateway_deployment.main.invoke_url}${aws_api_gateway_stage.main.stage_name}"
}

output "execution_arn" {
  description = "API Gatewayの実行ARN"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "usage_plan_id" {
  description = "Usage Plan ID（レート制限が有効な場合）"
  value       = var.enable_throttling ? aws_api_gateway_usage_plan.main[0].id : null
}

output "api_key_id" {
  description = "API Key ID（レート制限が有効な場合）"
  value       = var.enable_throttling ? aws_api_gateway_api_key.main[0].id : null
}

output "api_key_value" {
  description = "API Key値（レート制限が有効な場合）"
  value       = var.enable_throttling ? aws_api_gateway_api_key.main[0].value : null
  sensitive   = true
}

output "authorizer_id" {
  description = "Cognito Authorizer ID"
  value       = var.cognito_user_pool_arn != null ? aws_api_gateway_authorizer.cognito[0].id : null
}

