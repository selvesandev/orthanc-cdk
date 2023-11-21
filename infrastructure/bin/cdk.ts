#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { OrthancStack } from "../lib/orthanc-stack";
import { NetworkStack } from "../lib/networking-stack";
import { StorageStack } from "../lib/storage-stack";
import {
  ACCESS_LOGS_BUCKET_ARN,
  APP_ACCOUNT_ID,
  APP_AWS_REGION,
  APP_NETWORK_STACK_NAME,
  APP_ORTHANC_STACK_NAME,
  APP_STORAGE_STACK_NAME,
  ENABLE_DICOM_S3_STORAGE,
  ENABLE_MULTI_AZ,
  ENABLE_RDS_BACKUP,
  ENABLE_VPC_FLOW_LOGS,
} from "../config/app.config";

// ********************************
// App & Stack configuration
// ********************************

const app = new App();

const networkStack = new NetworkStack(app, APP_NETWORK_STACK_NAME, {
  env: { account: APP_ACCOUNT_ID, region: APP_AWS_REGION },
  enable_vpc_flow_logs: ENABLE_VPC_FLOW_LOGS,
});

const storageStack = new StorageStack(app, APP_STORAGE_STACK_NAME, {
  env: { account: APP_ACCOUNT_ID, region: APP_AWS_REGION },
  vpc: networkStack.vpc,
  dbClusterSecurityGroup: networkStack.dbClusterSecurityGroup,
  efsSecurityGroup: networkStack.efsSecurityGroup,
  enable_dicom_s3_storage: ENABLE_DICOM_S3_STORAGE,
  enable_multi_az: ENABLE_MULTI_AZ,
  enable_rds_backup: ENABLE_RDS_BACKUP,
});

const orthancStack = new OrthancStack(app, APP_ORTHANC_STACK_NAME, {
  env: { account: APP_ACCOUNT_ID, region: APP_AWS_REGION },
  vpc: networkStack.vpc,
  orthancBucket: storageStack.orthancBucket,
  orthancFileSystem: storageStack.fileSystem,
  rdsInstance: storageStack.rdsInstance,
  secret: storageStack.rdsSecret,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  loadBalancerSecurityGroup: networkStack.loadBalancerSecurityGroup,
  enable_dicom_s3_storage: ENABLE_DICOM_S3_STORAGE,
  enable_multi_az: ENABLE_MULTI_AZ,
  access_logs_bucket_arn: ACCESS_LOGS_BUCKET_ARN,
  efsAccessPoint: storageStack.efsAccessPoint,
});
