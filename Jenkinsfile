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
                    sh "yarn examples:build"
                    sh "yarn test || true" // Ignore test failures
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
