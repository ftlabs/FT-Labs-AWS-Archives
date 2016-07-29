# scanqueue

Image goes in, OCRd content comes out.

## Usage

To install:

```
npm i
```

To run:

```
npm run start
```

## Details

#### What does it do?
scanqueue polls an SQS queue to find out which, if any, newspaper articles need to be scanned. As such scanqueue needs appropriate credentials to access the AWS services OR if the app is run as part of an EC2 instance, a role with the neccessary permissions can be added to the machine to grant access.

#### What Services does this app use?
Amazon SQS
Amazon S3

