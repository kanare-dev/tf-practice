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

