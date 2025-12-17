variable "api_name" {
  description = "API Gateway名"
  type        = string
}

variable "api_description" {
  description = "API Gatewayの説明"
  type        = string
  default     = ""
}

variable "stage_name" {
  description = "API Gatewayステージ名"
  type        = string
  default     = "dev"
}

variable "endpoint_type" {
  description = "エンドポイントタイプ（REGIONAL, EDGE, PRIVATE）"
  type        = string
  default     = "REGIONAL"
}

variable "lambda_invoke_arn" {
  description = "Lambda関数の呼び出しARN"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda関数名"
  type        = string
}

variable "authorization_type" {
  description = "認証タイプ（NONE, AWS_IAM, COGNITO_USER_POOLS, CUSTOM）"
  type        = string
  default     = "NONE"
}

variable "authorizer_id" {
  description = "認証者のID（オプション）"
  type        = string
  default     = null
}

variable "enable_metrics" {
  description = "CloudWatchメトリクスを有効化するか"
  type        = bool
  default     = true
}

variable "logging_level" {
  description = "ログレベル（OFF, ERROR, INFO）"
  type        = string
  default     = "INFO"
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

