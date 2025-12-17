output "function_name" {
  description = "Lambda関数名"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "Lambda関数ARN"
  value       = aws_lambda_function.main.arn
}

output "function_invoke_arn" {
  description = "Lambda関数の呼び出しARN"
  value       = aws_lambda_function.main.invoke_arn
}

output "role_arn" {
  description = "Lambda関数のIAMロールARN"
  value       = aws_iam_role.lambda_role.arn
}

