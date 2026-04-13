variable "db_password" {
  description = "RDS PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for all services"
  type        = string
  sensitive   = true
  default     = "skillnest_super_secret_key_2024"
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}
