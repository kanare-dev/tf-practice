terraform {
  backend "s3" {
    bucket         = "kanare-terraform-state-bucket"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
