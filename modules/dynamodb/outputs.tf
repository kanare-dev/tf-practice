output "table_id" {
  description = "DynamoDBテーブルID"
  value       = aws_dynamodb_table.main.id
}

output "table_arn" {
  description = "DynamoDBテーブルARN"
  value       = aws_dynamodb_table.main.arn
}

output "table_name" {
  description = "DynamoDBテーブル名"
  value       = aws_dynamodb_table.main.name
}

