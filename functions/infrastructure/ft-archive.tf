provider "aws" {
  access_key = ""
  secret_key = ""
  region     = "eu-west-1"
}

resource "aws_instance" "ft-labs-archive-example" {
  ami           = "ami-241fad57"
  instance_type = "t2.micro"
  vpc_security_group_ids = ["sg-a5fd99c0"]
  subnet_id = "subnet-73ecbc35"

  tags {
    Name = "ft-labs-archive-example"
    FT-Labs = "true"
    FT-Archive = "true"
  }
}
