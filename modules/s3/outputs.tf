output "bucket_id" {
  description = "S3バケットID"
  value       = aws_s3_bucket.web_app.id
}

output "bucket_arn" {
  description = "S3バケットARN"
  value       = aws_s3_bucket.web_app.arn
}

output "website_endpoint" {
  description = "静的Webサイトホスティングのエンドポイント"
  value       = var.enable_static_hosting ? aws_s3_bucket_website_configuration.web_app[0].website_endpoint : null
}

output "lambda_deployment_bucket_id" {
  description = "Lambdaデプロイパッケージ用S3バケットID"
  value       = var.create_lambda_deployment_bucket ? aws_s3_bucket.lambda_deployments[0].id : null
}

output "lambda_deployment_bucket_arn" {
  description = "Lambdaデプロイパッケージ用S3バケットARN"
  value       = var.create_lambda_deployment_bucket ? aws_s3_bucket.lambda_deployments[0].arn : null
}

