#!/usr/bin/env groovy
def label = "buildpod.${env.JOB_NAME}.${env.BUILD_NUMBER}".replace('-', '_').replace('/', '_').take(63)
def gitCredentialsId = "github"
def imageRepo = "100.69.158.196"
def ip_address = "3.132.12.28"
def sshagent_name = "internal-trading"
def service_name = "internal-trading-backend"
def artifact_name = "${service_name}#${env.BRANCH_NAME}#${env.BUILD_NUMBER}"

def myRepo = null

podTemplate(label: label, nodeSelector: 'env=jenkins' , containers: [
    containerTemplate(
        name: 'node', 
        resourceRequestCpu: '50m',
        resourceLimitCpu: '2000m',
        resourceRequestMemory: '100Mi',
        resourceLimitMemory: '2500Mi',
        image: 'node:12.16', 
        command: 'cat', 
        ttyEnabled: true),
    containerTemplate(
        name: 'build-container',
        image: imageRepo + '/buildtool:deployer',
        command: 'cat',
        ttyEnabled: true),
    containerTemplate(
        name: 'pm291',
        image: imageRepo + '/buildtool:pm291',
        command: 'cat',
        ttyEnabled: true),
], 
volumes: [
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')
  ]

){
timeout(9){
    def namespace;
    node(label) {

        deleteDir()

        stage('Download Environment Files'){
            container('node'){
                echo 'Stage: Download Environment Files'
                myRepo = checkout scm
                gitCommit = myRepo.GIT_COMMIT
                shortGitCommit = "${gitCommit[0..10]}${env.BUILD_NUMBER}"
                imageTag = shortGitCommit
                namespace = getNamespace(myRepo.GIT_BRANCH);
            }
        }

        stage('Build Code'){
            container('node'){ 
                if ( "${myRepo.GIT_BRANCH}" == "preprod"  ){
                    withAWS(credentials:'jenkins_s3_upload') {
                        s3Download(file:'.env', bucket:'env.faldax', path:"internal-trading/preprod/.env", force:true)
                    }
                    sh "mv .env src/.env && cd src && npm install"
                }
            }
        }

        stage('Package Code'){
            container('node'){ 
                if ( "${myRepo.GIT_BRANCH}" == "preprod"  ){
                    sh "cd src && tar -czf ${env.WORKSPACE}/${artifact_name}.tar.gz ."
                }
            }
        }

        stage('Deploy - preprod') {

            if (env.BRANCH_NAME == "preprod" ){
                sshagent(credentials: ["${sshagent_name}"]) {
                    sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'bash -s' < ./pre-deploy.sh ${service_name}-preprod"
                    sh "scp -o StrictHostKeyChecking=no ${env.WORKSPACE}/${artifact_name}.tar.gz ubuntu@${ip_address}:/home/ubuntu/.tmp/builds/${service_name}-preprod"
                    sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'bash -s' < ./deploy.sh ${service_name}-preprod ${artifact_name}"
                }
            }
        }

        stage('Docker - mainnet'){
            container('build-container'){
                if ( "${myRepo.GIT_BRANCH}" == "mainnet" && namespace ){
                    echo "Deploying ${myRepo.GIT_BRANCH} on Kubernetes."
                    withAWS(credentials:'jenkins_s3_upload') {
                        s3Download(file:'.env', bucket:'env.faldax', path:"internal-trading/${namespace}/.env", force:true)
                    }
                    sh "ls -a"
                    sh "docker build -t ${imageRepo}/internal-trading:${imageTag}  ."
                    sh "docker push  ${imageRepo}/internal-trading:${imageTag}"
                    sh "helm upgrade --install --namespace ${namespace} --set image.tag=${imageTag} ${namespace}-internal-trading -f chart/values-${namespace}.yaml chart/"
                }
            }
        }

    }
}   
}

def getNamespace(branch){
    switch(branch){
        case 'master' : return "prod";
        case 'development' :  return "dev";
        case 'pre-prod' : return "pre-prod";
        case 'mainnet' : return "mainnet";
        case 'qa' : return "qa";
        default : return null;
    }
}