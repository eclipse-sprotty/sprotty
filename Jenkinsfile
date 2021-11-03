def kubernetes_config = """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:12-alpine
    tty: true
    resources:
      limits:
        memory: "2Gi"
        cpu: "1"
      requests:
        memory: "2Gi"
        cpu: "1"
    volumeMounts:
    - mountPath: "/.yarn"
      name: "yarn-global"
      readonly: false
  volumes:
  - name: "yarn-global"
    emptyDir: {}
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

    environment {
        YARN_CACHE_FOLDER = "${env.WORKSPACE}/yarn-cache"
        SPAWN_WRAP_SHIM_ROOT = "${env.WORKSPACE}"
    }
    
    stages {
        stage('Build sprotty') { 
            steps {
                container('node') {
                    sh "yarn install"
                    sh "yarn test || true" // Ignore test failures
                }
            }
        }

        stage('Deploy (master only)') {
            when { branch 'master'}
            steps {
                build job: 'deploy-sprotty', wait: false
            }
        }
    }
    
    post {
        success {
            junit 'packages/sprotty/artifacts/test/xunit.xml'
            archiveArtifacts 'packages/sprotty/artifacts/coverage/**'
        }
    }
}
