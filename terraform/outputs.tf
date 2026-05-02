output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "dynamodb_users_table" {
  description = "DynamoDB users table name"
  value       = aws_dynamodb_table.users.name
}

output "dynamodb_decisions_table" {
  description = "DynamoDB decisions table name"
  value       = aws_dynamodb_table.decisions.name
}

output "dynamodb_personality_questions_table" {
  description = "DynamoDB personality questions table name"
  value       = aws_dynamodb_table.personality_questions.name
}
