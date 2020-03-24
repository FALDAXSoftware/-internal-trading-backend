#!/usr/bin/env groovy
def label = "buildpod.${env.JOB_NAME}.${env.BUILD_NUMBER}".replace('-', '_').replace('/', '_').take(63)
def gitCredentialsId = "github"
def imageRepo = "100.69.158.196"
def ip_address = "3.132.12.28"
def sshagent_name = "internal-trading"
def service_name = "internal-trading-backend"
def artifact_name = "${service_name}#${env.BRANCH_NAME}#${env.BUILD_NUMBER}#${env.DEPLOY_ENV}"

podTemplate(label: label, nodeSelector: 'env=jenkins' , containers: [
     containerTemplate(
        name: 'node', 
        resourceRequestCpu: '50m',
        resourceLimitCpu: '2000m',
        resourceRequestMemory: '100Mi',
        resourceLimitMemory: '2500Mi',
        image: 'node:12.16-alpine', 
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

            // Wipe the workspace so we are building completely clean
            deleteDir()

            stage('Download Environment Files'){
                container('node'){
                    def myRepo = checkout scm
                    gitCommit = myRepo.GIT_COMMIT
                    shortGitCommit = "${gitCommit[0..10]}${env.BUILD_NUMBER}"
                    imageTag = shortGitCommit
                    namespace = getNamespace(myRepo.GIT_BRANCH);
                }
            }

            stage('Build Code'){
                container('node'){ 
                    if (namespace) {
                        withAWS(credentials:'jenkins_s3_upload') {
                            s3Download(file:'.env', bucket:'env.faldax', path:"internal-trading/${namespace}/.env", force:true)
                        }
                        sh "mv .env src/.env && cd src && npm install"
                    }
                }
            }

            stage('Package Code'){
                container('node'){ 
                    if (namespace) {
                        sh "cd src && tar -czf ${env.WORKSPACE}/${artifact_name}.tar.gz ."
                    }
                }
            }

            stage('Deploy - preprod') {

                if (env.BRANCH_NAME == "preprod"){
                    sshagent(credentials: ["${sshagent_name}"]) {
                        sh "ssh ubuntu@${ip_address} 'bash -s' < ./pre-deploy.sh ${service_name}-preprod"
                        sh "scp ${env.WORKSPACE}/${artifact_name}.tar.gz futurx@${ip_address}:/home/ubuntu/.tmp/builds/${service_name}-preprod"
                        sh "ssh futurx@${ip_address} 'bash -s' < ./deploy.sh ${service_name}-preprod ${artifact_name}"
                    }
                }
            }

            stage('Deploy - mainnet') {

                if (env.BRANCH_NAME == "mainnet"){
                    sshagent(credentials: ["${sshagent_name}"]) {      
                        sh "ssh ubuntu@${ip_address} 'bash -s' < ./pre-deploy.sh ${service_name}-mainnet"
                        sh "scp ${env.WORKSPACE}/${artifact_name}.tar.gz futurx@${ip_address}:/home/ubuntu/.tmp/builds/${service_name}-mainnet"
                        sh "ssh futurx@${ip_address} 'bash -s' < ./deploy.sh ${service_name}-mainnet ${env.ARTIFACT_NAME}"
                    }
                }
            }

        }
    }
}

def getNamespace(branch){
    switch (branch) {
        case 'master': return "prod";
        case 'preprod': return "preprod";
        case 'mainnet': return "mainnet";
        default: return null;
    }
}