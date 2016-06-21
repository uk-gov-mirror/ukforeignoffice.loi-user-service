node {
    stage 'Step 1: Test'
        build job: 'Service Testing/Unit testing/User Service Test', parameters: [[$class: 'StringParameterValue', name: 'Branch', value: '*/Pre-Production']]
    stage 'Step 2: Deploy to PreProduction'
           build job: 'Service Deployment/Deploy to PreProduction', parameters: [[$class: 'StringParameterValue', name: 'Repo',value: 'https://github.com/UKForeignOffice/loi-user-service.git/'], [$class: 'StringParameterValue', name: 'Branch', value: 'Pre-Production'],[$class: 'StringParameterValue', name: 'Tag', value: 'user-service-preprod'], [$class: 'StringParameterValue', name: 'Container', value: 'user-service']]
   }