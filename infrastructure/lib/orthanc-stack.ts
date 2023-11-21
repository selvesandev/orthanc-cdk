// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";

import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function,
  FunctionCode,
  FunctionEventType,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
} from "aws-cdk-lib/aws-cloudfront";
import { LoadBalancerV2Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  AwsLogDriver,
  Cluster,
  ContainerDefinition,
  ContainerImage,
  FargatePlatformVersion,
  FargateTaskDefinition,
  LinuxParameters,
  Protocol,
  Secret,
  Volume,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { AccessPoint, FileSystem } from "aws-cdk-lib/aws-efs";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {
  APP_ORTHANC_ECS_CLUSTER_NAME,
  APP_ORTHANC_ECS_TASK_DEFINITION_NAME,
} from "../config/app.config";

export class OrthancStack extends Stack {
  constructor(scope: Construct, id: string, props: OrthancStackProps) {
    super(scope, id, props);

    // ********************************
    // Orthanc Credentials (Secrets Manager)
    // ********************************
    const orthancCredentials = new secretsmanager.Secret(
      this,
      "Orthanc-Credentials",
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: "admin",
          excludeCharacters: "'\"@/\\",
          passwordLength: 16,
        },
      }
    );

    // ********************************
    // ECS Fargate Cluster & ALB & Task definition
    // ********************************
    const cluster = new Cluster(this, APP_ORTHANC_ECS_CLUSTER_NAME, {
      vpc: props.vpc,
    });

    // create a task definition with CloudWatch Logs
    const logging = new AwsLogDriver({
      streamPrefix: "orthanc",
    });

    const taskDef = new FargateTaskDefinition(
      this,
      APP_ORTHANC_ECS_TASK_DEFINITION_NAME,
      {
        memoryLimitMiB: 24576,
        cpu: 4096,
      }
    );

    let orthancConfig = {
      AwsS3Storage: {
        BucketName: props.orthancBucket?.bucketName,
        Region: Aws.REGION,
        ConnectionTimeout: 30,
        RequestTimeout: 3600,
        RootPath: "",
        StorageStructure: "flat",
        MigrationFromFileSystemEnabled: false,
      },
      StorageCompression: false,
      LimitFindResults: 10,
      LimitFindInstances: 10,
      /** New Configurations */
      // LimitFindSeries: 50,
      // LimitFindStudies: 50,
      // LimitFindPatients: 50,
      // LimitFindModalities: 50,
      // LimitFindSeriesMetadata: 50,
      // LimitFindStudiesMetadata: 50,
      // LimitFindPatientsMetadata: 50,
      // LimitFindModalitiesMetadata: 50,
      // LimitFindInstancesMetadata: 50,
      // LimitFindSeriesAttachments: 50,
      // LimitFindStudiesAttachments: 50,
      // LimitFindPatientsAttachments: 50,
      // LimitFindModalitiesAttachments: 50,
      // LimitFindInstancesAttachments: 50,
      // LimitFindSeriesTags: 50,
      // LimitFindStudiesTags: 50,
      // LimitFindPatientsTags: 50,
      // LimitFindModalitiesTags: 50,
      // LimitFindInstancesTags: 50,
      // LimitJobs: 5,
      /** End New Configurations */

      KeepAlive: true,
      TcpNoDelay: true,
      StorageAccessOnFind: "Always",
      // StorageAccessOnFind: "Never",
      SaveJobs: false,
      ssl: true,
      HttpCompressionEnabled: true,
      Housekeeper: {
        Enabled: true,
        GlobalPropertyId: 1025,
        Force: false,
        ThrottleDelay: 5,
        Triggers: {
          StorageCompressionChange: true,
          MainDicomTagsChange: true,
          UnnecessaryDicomAsJsonFiles: true,
          IngestTranscodingChange: true,
        },
      },
      DicomWeb: {
        Enable: true,
        Ssl: true,
        // StudiesMetadata: "MainDicomTags",
        // SeriesMetadata: "MainDicomTags",
        StudiesMetadata: "Full",
        SeriesMetadata: "Full",

        // StudiesMetadata: "Extrapolate",
        // StudiesMetadataExtrapolatedTags: [
        // "AcquisitionDate",
        // "OpticalPathSequence",
        // "AccessionNumber",
        // "OpticalPathSequence",

        // ],
        // SeriesMetadata: "Extrapolate",
        // SeriesMetadataExtrapolatedTags: [
        //   "BitsAllocated",
        //   "BitsStored",
        //   "ImageType",
        //   "Columns",
        //   "HighBit",
        //   "PhotometricInterpretation",
        //   "PixelSpacing",
        //   "PlanarConfiguration",
        //   "RescaleIntercept",
        //   "RescaleSlope",
        //   "Rows",
        //   "SOPClassUID",
        //   "SamplesPerPixel",
        //   "SliceThickness",
        //   "ContainerIdentifier",
        //   "ContainerTypeCodeSequence",
        //   "IlluminationTypeCodeSequence",
        //   "IlluminationWaveLength",
        //   "OpticalPathIdentifier",
        //   "OpticalPathSequence",
        // ],
      },
      ExtraMainDicomTags: {
        Instance: [
          "Rows",
          "Columns",
          "ImageType",
          "SOPClassUID",
          "ContentDate",
          "ContentTime",
          "FrameOfReferenceUID",
          "PixelSpacing",
          "SpecificCharacterSet",
          "BitsAllocated",
          "BitsStored",
          "RescaleSlope",
          "RescaleIntercept",
          "SliceThickness",
          "WindowCenter",
          "WindowWidth",
          "PhotometricInterpretation",
          "PixelRepresentation",
          "OpticalPathSequence",
          "ConcatenationFrameOffsetNumber",
          "SharedFunctionalGroupsSequence",
          "PerFrameFunctionalGroupsSequence",
          "TotalPixelMatrixRows",
          "TotalPixelMatrixColumns",
          "TotalPixelMatrixOriginSequence"
        ],
        Series: [
          "TimezoneOffsetFromUTC",
          "PerformedProcedureStepStartDate",
          "PerformedProcedureStepStartTime",
          "RequestAttributesSequence",
          "NumberOfSeriesRelatedInstances",
          "ImageOrientationSlide",
          // "PlanePositionSlideSequence"
        ],
        Study: [
          "TimezoneOffsetFromUTC",
          // "PatientID",
          // "PatientBirthDate",
          // "PatientSex",
          // "PatientName"
        ],
        Patient: [],
      },
    };

    let container = {
      image: ContainerImage.fromAsset("./lib/local-image-official-s3/"),
      logging,
      taskDefinition: taskDef,
      environment: {
        ORTHANC__POSTGRESQL__HOST: props.rdsInstance.dbInstanceEndpointAddress,
        ORTHANC__POSTGRESQL__PORT: props.rdsInstance.dbInstanceEndpointPort,
        LOCALDOMAIN: Aws.REGION + ".compute.internal-orthanconaws.local",
        DICOM_WEB_PLUGIN_ENABLED: "true",
        // DICOM_WEB_PLUGIN_SSL: "true",
        ORTHANC__POSTGRESQL__USERNAME: "postgres",
        VERBOSE_STARTUP: "true",      // uncomment to enable verbose logging in container
        //VERBOSE_ENABLED: "true",      // uncomment to enable verbose logging in container
        //TRACE_ENABLED: "true",        // uncomment to enable trace level logging in container
        STONE_WEB_VIEWER_PLUGIN_ENABLED: "true",
        STORAGE_BUNDLE_DEFAULTS: "false",
        LD_LIBRARY_PATH: "/usr/local/lib",
        WSI_PLUGIN_ENABLED: "true",
        ORTHANC_JSON: props.enable_dicom_s3_storage
          ? JSON.stringify(orthancConfig)
          : "{}",
        // If we disabled S3, remove the plugin so it won't cause issues at startup
        BEFORE_ORTHANC_STARTUP_SCRIPT: props.enable_dicom_s3_storage
          ? ""
          : "/tmp/custom-script.sh",
      },
      secrets: {
        ORTHANC__REGISTERED_USERS:
          Secret.fromSecretsManager(orthancCredentials),
        ORTHANC__POSTGRESQL__PASSWORD: Secret.fromSecretsManager(props.secret),
      },
      linuxParameters: new LinuxParameters(this, "OrthancLinuxParams", {
        initProcessEnabled: true,
      }),
      containerName: "orthanc-container",
      portMappings: [
        {
          containerPort: 8042,
          hostPort: 8042,
          protocol: Protocol.TCP,
        },
        {
          containerPort: 4242,
          hostPort: 4242,
          protocol: Protocol.TCP,
        },
      ],
      SecurityGroup: props.ecsSecurityGroup,
    };

    const orthancContainerDefinition: ContainerDefinition =
      taskDef.addContainer("OrthancContainer", container);
    orthancCredentials.grantRead(
      orthancContainerDefinition.taskDefinition.taskRole
    );
    props.secret.grantRead(orthancContainerDefinition.taskDefinition.taskRole);

    if (props.enable_dicom_s3_storage) {
      // If S3 DICOM storage is enabled, add neccessary permissions to bucket
      props.orthancBucket?.grantReadWrite(taskDef.taskRole);
    } else {
      // If S3 DICOM storage is disabled, fall back to EFS - add volume and mount points
      const volume: Volume = {
        name: "orthanc-efs",
        efsVolumeConfiguration: {
          fileSystemId: props.orthancFileSystem?.fileSystemId
            ? props.orthancFileSystem?.fileSystemId
            : "",
          transitEncryption: "ENABLED",
          authorizationConfig: {
            accessPointId: props.efsAccessPoint?.accessPointId,
            iam: "ENABLED",
          },
        },
      };

      orthancContainerDefinition.addMountPoints({
        containerPath: "/var/lib/orthanc/db",
        sourceVolume: volume.name,
        readOnly: false,
      });
      taskDef.addVolume(volume);
    }

    const loadBalancer = new ApplicationLoadBalancer(
      this,
      "OrthancLoadBalancer",
      {
        vpc: props.vpc,
        securityGroup: props.loadBalancerSecurityGroup,
        internetFacing: true,
      }
    );

    if (props.access_logs_bucket_arn != "") {
      loadBalancer.logAccessLogs(
        Bucket.fromBucketArn(
          this,
          "MyAccessLogBucket",
          props.access_logs_bucket_arn
        )
      );
    }

    const fargateService = new ApplicationLoadBalancedFargateService(
      this,
      "OrthancService",
      {
        cluster,
        loadBalancer: loadBalancer,
        taskDefinition: taskDef,
        desiredCount: props.enable_multi_az ? 2 : 1,
        platformVersion: FargatePlatformVersion.VERSION1_4,
        securityGroups: [props.ecsSecurityGroup],
      }
    );

    fargateService.targetGroup.configureHealthCheck({
      path: "/",
      interval: Duration.seconds(60),
      healthyHttpCodes: "200-499", // We have to check for 401 as the default state of "/" is unauthenticated
    });

    // ********************************
    // Cloudfront Distribution
    // ********************************

    const cors = new Function(this, "CorsFunction", {
      code: FunctionCode.fromInline(`
        function handler(event) {
          if(event.request.method === 'OPTIONS') {
              var response = {
                  statusCode: 204,
                  statusDescription: 'OK',
                  headers: {
                      'access-control-allow-origin': { value: '*' },
                      'access-control-allow-headers': { value: '*' }
                  }
              };
              return response;
          }
          return event.request;
        }
      `),
    });

    const orthancDistribution = new Distribution(this, "OrthancDistribution", {
      defaultBehavior: {
        origin: new LoadBalancerV2Origin(loadBalancer, {
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy:
          ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        functionAssociations: [
          {
            function: cors,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
    });

    // ********************************
    // Stack Outputs
    // ********************************
    new CfnOutput(this, "OrthancCredentialsName", {
      value: orthancCredentials.secretName,
      description: "The name of the OrthancCredentials secret",
      exportName: "orthancCredentialsName",
    });

    new CfnOutput(this, "OrthancURL", {
      value: orthancDistribution.distributionDomainName,
      description: "Orthanc Distribution URL",
      exportName: "orthancDistributionURL",
    });
  }
}

interface OrthancStackProps extends StackProps {
  vpc: IVpc;
  orthancBucket?: Bucket;
  orthancFileSystem?: FileSystem;
  rdsInstance: DatabaseInstance;
  secret: secretsmanager.Secret;
  ecsSecurityGroup: SecurityGroup;
  loadBalancerSecurityGroup: SecurityGroup;
  enable_dicom_s3_storage: Boolean;
  enable_multi_az: Boolean;
  access_logs_bucket_arn: string;
  efsAccessPoint?: AccessPoint;
}
