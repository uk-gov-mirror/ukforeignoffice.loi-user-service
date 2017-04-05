node {
    stage 'Step 1: Create Production Image'
          build job: 'Service Deployment/Deploy to PreProduction', parameters: [[$class: 'StringParameterValue', name: 'Repo',value: 'git@github-project-user:UKForeignOffice/loi-user-service.git'], [$class: 'StringParameterValue', name: 'Branch', value: 'Pre-Production'],[$class: 'StringParameterValue', name: 'Tag', value: 'user-service-preprod'], [$class: 'StringParameterValue', name: 'Container', value: 'user-service']]
     }
