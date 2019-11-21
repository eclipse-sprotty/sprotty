def kubernetes_config = """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:8.12-alpine
    tty: true
    resources:
      limits:
        memory: "2Gi"
        cpu: "1"
      requests:
        memory: "2Gi"
        cpu: "1"
"""

pipeline {
    agent {
        kubernetes {
            label 'sprotty-agent-pod'
            yaml kubernetes_config
        }
    }
    options {
        buildDiscarder logRotator(numToKeepStr: '15')
    }
    
    stages {
        stage('Build sprotty') {
            environment {
                SPAWN_WRAP_SHIM_ROOT = "${env.WORKSPACE}"
                YARN_ARGS = "--cache-folder ${env.WORKSPACE}/yarn-cache --global-folder ${env.WORKSPACE}/yarn-global"
            }
            steps {
                container('node') {
                    sh "yarn ${env.YARN_ARGS} install"
                    sh "yarn ${env.YARN_ARGS} examples:build"
                    sh "yarn ${env.YARN_ARGS} test || true" // Ignore test failures
                }
            }
        }
    }
    
    post {
        success {
            junit 'artifacts/test/xunit.xml'
            archiveArtifacts 'artifacts/coverage/**'
        }
    }
}