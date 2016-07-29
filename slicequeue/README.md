# slicequeue

Slices archive newspaper images into the article sections described in the XML.

## Usage

To install:

```
npm i
```

To run:

```
node ./index.js
```
## Details

#### What does it do?
slicequeue takes a job from an SQS queue and uses the information therein to retrieve a article from an S3 bucket and slice it up into the individual articles that make up each page of an issue. The individual article images are then uploaded to a seperate S3 bucket, and a new job to scan each one is added to a second S3 queue.

#### What Services does this app use?
Amazon SQS
Amazon S3