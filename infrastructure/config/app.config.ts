// ********************************
// Deployment parameters
// ********************************

// const APP_ENVIRONMENT = "PROD"; // DEV or PROD
const APP_ENVIRONMENT = "DEV"; // DEV or PROD

export const APP_AWS_REGION = "eu-west-1"; // DEV
// export const APP_AWS_REGION = "us-east-2"; // PROD
export const APP_ACCOUNT_ID = "476926510278";
export const APP_NETWORK_STACK_NAME = `Orthanc-Network-${APP_ENVIRONMENT}`;
export const APP_STORAGE_STACK_NAME = `Orthanc-Storage-${APP_ENVIRONMENT}`;
export const APP_ORTHANC_STACK_NAME = `Orthanc-ECS-${APP_ENVIRONMENT}`;

export const ENABLE_DICOM_S3_STORAGE = true; // If true, use an S3 bucket as the DICOM image store, otherwise use EFS
export const ACCESS_LOGS_BUCKET_ARN = ""; // If provided, enables ALB access logs using the specified bucket ARN
export const ENABLE_MULTI_AZ = false; // If true, uses multi-AZ deployment for RDS and ECS
export const ENABLE_RDS_BACKUP = false; // If true, enables automatic backup for RDS
export const ENABLE_VPC_FLOW_LOGS = false; // If true, enables VPC flow logs to CloudWatch

export const APP_RDS_SECRET_KEY_NAME = `Orthanc-RDSDatabaseSecret-${APP_ENVIRONMENT}`;
export const APP_BUCKET_KMS_KEY_NAME = `OrthancBucketKey${APP_ENVIRONMENT}`;
export const APP_ORTHANC_EFS_KEY_NAME = `OrthancEFSKey${APP_ENVIRONMENT}`;
export const APP_BUCKET_STACK_NAME = `OrthancBucket${APP_ENVIRONMENT}`;
export const APP_BUCKET_NAME = `orthanc-bucket${APP_ENVIRONMENT.toLowerCase()}`;
export const APP_FILE_SYSTEM_NAME = `OrthancFileSystem${APP_ENVIRONMENT}`;
export const APP_EFS_ACCESS_POINT = `NFSAccessPoint${APP_ENVIRONMENT}`;
export const APP_RDS_KMS_KEY_NAME = `OrthancRDSKey${APP_ENVIRONMENT}`;
export const APP_RDS_DATABASE_INSTANCE_NAME = `OrthancInstance${APP_ENVIRONMENT}`;
export const APP_RDS_DATABASE_NAME = `OrthancDB${APP_ENVIRONMENT}`;

export const APP_ORTHANC_ECS_CLUSTER_NAME = `OrthancCluster${APP_ENVIRONMENT}`;
export const APP_ORTHANC_ECS_TASK_DEFINITION_NAME = `OrthancTaskDefinition${APP_ENVIRONMENT}`;
