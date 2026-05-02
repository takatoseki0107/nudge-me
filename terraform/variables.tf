variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name used as resource name prefix"
  type        = string
  default     = "nudge-me"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "jwt_secret" {
  description = "JWT signing secret (32+ characters)"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Frontend URL for CORS"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment zip"
  type        = string
  default     = "../backend/bootstrap.zip"
}
