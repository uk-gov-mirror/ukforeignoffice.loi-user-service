node {
    stage 'Step 1: Create Production Image'
         build job:  'Service Deployment/Production Deployment/Create Production Images', parameters: [[$class: 'StringParameterValue', name: 'Repo', value: 'git@github-project-user:UKForeignOffice/loi-user-service.git'], [$class: 'StringParameterValue', name: 'Branch', value: 'master'], [$class: 'StringParameterValue', name: 'Tag', value: 'user-service-prod'], [$class: 'StringParameterValue', name: 'Container', value: 'user-service']]         
     }
