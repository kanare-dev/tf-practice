variable "function_name" {
  description = "Lambda関数名"
  type        = string
}

variable "source_file" {
  description = "Lambda関数のソースファイルパス"
  type        = string
}

variable "handler" {
  description = "Lambda関数のハンドラー（例: index.handler）"
  type        = string
}

variable "runtime" {
  description = "Lambda関数のランタイム（例: python3.11, nodejs18.x）"
  type        = string
  default     = "python3.11"
}

variable "timeout" {
  description = "Lambda関数のタイムアウト（秒）"
  type        = number
  default     = 3
}

variable "memory_size" {
  description = "Lambda関数のメモリサイズ（MB）"
  type        = number
  default     = 128
}

variable "environment_variables" {
  description = "Lambda関数の環境変数"
  type        = map(string)
  default     = {}
}

variable "dead_letter_queue_arn" {
  description = "デッドレターキューのARN（オプション）"
  type        = string
  default     = null
}

variable "additional_policy_json" {
  description = "追加のIAMポリシー（JSON形式）"
  type        = string
  default     = null
}

variable "log_retention_days" {
  description = "CloudWatch Logsの保持期間（日数）"
  type        = number
  default     = 7
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

