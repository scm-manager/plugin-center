#!/usr/bin/env groovy
def version = 'UNKNOWN'

pipeline {

 options {
   buildDiscarder(logRotator(numToKeepStr: '10'))
 }

  agent {
    node {
      label 'docker'
    }
  }

  stages {

    stage('Environment') {
      steps {
        script {
          def commitHashShort = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
          version = "${new Date().format('yyyyMMddHHmm')}-${commitHashShort}".trim()
        }
      }
    }

    stage('Docker') {
      agent {
        node {
          label 'docker'
        }
      }
      steps {
        script {
          docker.withRegistry('', 'hub.docker.com-cesmarvin') {
            def image = docker.build("scmmanager/plugin-center:${version}")
            image.push()
          }
        }
      }
    }

    stage('Deployment') {
      when {
        branch 'master'
      }
      agent {
        docker {
          image 'lachlanevenson/k8s-helm:v2.14.2'
          args  '--entrypoint=""'
        }
      }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-oss-helm', variable: 'KUBECONFIG')]) {
          sh "helm upgrade --install --set image.tag=${version} plugin-center deployment/plugin-center"
        }
      }
    }
    
  }
}