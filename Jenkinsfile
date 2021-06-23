#!groovy
node('docker') {

  def version = 'UNKNOWN'

  properties([
    // Keep only the last 10 build to preserve space
    buildDiscarder(logRotator(numToKeepStr: '10')),
    disableConcurrentBuilds()
  ])

  timeout(activity: true, time: 30, unit: 'MINUTES') {

    catchError {

      stage('Checkout') {
        checkout scm

        // TODO staging and prod use the same image and version scheme?
        def commitHashShort = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
        version = "${new Date().format('yyyyMMddHHmm')}-${commitHashShort}".trim()
      }

      if (env.BRANCH_NAME == 'master') {
        stage('Apply Cache') {
          sh 'rm -rf public .cache website.tar.gz || true'
          googleStorageDownload bucketUri: 'gs://scm-manager/cache/website.tar.gz', credentialsId: 'ces-demo-instances', localDirectory: '.'
          sh 'tar xfz cache/website.tar.gz'
          sh 'rm -rf cache'
        }
      } else {
        stage('Invalidate cache') {
          sh 'rm -rf public .cache website.tar.gz || true'
        }
      }

      stage('Dependencies') {
        withNode {
          sh "yarn install"
        }
      }

      stage('Collect Content') {
        withNode {
          withCredentials([usernamePassword(credentialsId: 'cesmarvin-github', passwordVariable: 'GITHUB_API_TOKEN', usernameVariable: 'GITHUB_ACCOUNT')]) {
            sh "yarn run collect-content"
          }
        }
      }

      stage('Build') {
        def siteUrl = env.BRANCH_NAME == 'staging' ? 'https://staging-website.scm-manager.org' : 'https://scm-manager.org'
        withNode {
          withEnv(["SITE_URL=${siteUrl}"]) {
            sh "yarn run build"
          }
        }
      }

      stage('Image') {
        def image = docker.build "scmmanager/website:${version}"
        docker.withRegistry('', 'hub.docker.com-cesmarvin') {
          image.push()
        }
      }

      if (env.BRANCH_NAME == 'staging') {

        stage('Staging Deployment') {
          withHelm {
            sh "helm upgrade --install --values=deployment/staging.yml --set image.tag=${version} staging-website deployment/website"
          }
        }

      } else if (env.BRANCH_NAME == 'master') {

        stage('Deployment') {
          withHelm {
            sh "helm upgrade --install --set image.tag=${version} website deployment/website"
          }
        }

        stage('Trigger API Build') {
          build job: 'scm-manager-github/plugin-center-api/master', wait: false
        }

        stage('Update Cache') {
          sh "tar cfz website.tar.gz public .cache"
          googleStorageUpload bucket: 'gs://scm-manager/cache', credentialsId: 'ces-operations-internal', pattern: 'website.tar.gz'
        }

      }

    }
    if (currentBuild.currentResult == 'FAILURE') {
      mail to: "scm-team@cloudogu.com",
        subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - ${currentBuild.currentResult}!",
        body: "Check console output at ${BUILD_URL} to view the results."
    }

  }
}

void withNode(Closure closure) {
  docker.image('scmmanager/node-build:14.16.1').inside {
    withEnv(["HOME=${env.WORKSPACE}"]) {
      closure.call()
    }
  }
}

void withHelm(Closure closure) {
  docker.image('lachlanevenson/k8s-helm:v3.2.1').inside('--entrypoint=""') {
    withCredentials([file(credentialsId: 'helm-client-scm-manager', variable: 'KUBECONFIG')]) {
      closure.call()
    }
  }
}
