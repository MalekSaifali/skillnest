output "ec2_public_ip" {
  description = "EC2 public IP - use this for frontend API calls"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS"
  value       = aws_instance.app.public_dns
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.address
}

output "gateway_url" {
  description = "API Gateway URL"
  value       = "http://${aws_instance.app.public_ip}:4000"
}
