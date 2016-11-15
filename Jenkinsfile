node {
    #stage 'Step 1: Test'
        #build job: 'Service Testing/Unit testing/User Service Test', parameters: [[$class: 'StringParameterValue', name: 'Branch', value: '*/Development']]
     stage 'Step 1: Deploy to Integration'
            build job: 'Service Deployment/Deploy to Integration', parameters: [[$class: 'StringParameterValue', name: 'Repo', value: 'git@github-project-user:UKForeignOffice/loi-user-service.git'], [$class: 'StringParameterValue', name: 'Branch', value: 'Development'],[$class: 'StringParameterValue', name: 'Tag', value: 'user-service-int'], [$class: 'StringParameterValue', name: 'Container', value: 'user-service']]
    }