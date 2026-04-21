document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-email')
  const suggestionsContainer = document.getElementById('email-suggestions-container')
  const searchForm = document.getElementById('search-form')

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim()

    if (query.length < 3) {
      suggestionsContainer.innerHTML = ''
      suggestionsContainer.style.display = 'none'
      return
    }

    fetch(`/api/user/ajax-search-email?email=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((data) => {
        suggestionsContainer.innerHTML = ''
        if (data.length > 0) {
          suggestionsContainer.style.display = 'block'
          data.forEach((user) => {
            const suggestion = document.createElement('div')
            suggestion.classList.add('email-suggestion')
            suggestion.textContent = user.email
            suggestion.setAttribute('data-email', user.email)

            // Click to select email and submit form
            suggestion.addEventListener('click', function () {
              searchInput.value = this.dataset.email
              suggestionsContainer.innerHTML = ''
              suggestionsContainer.style.display = 'none'
              searchForm.submit()
            })

            suggestionsContainer.appendChild(suggestion)
          })
        } else {
          suggestionsContainer.style.display = 'none'
        }
      })
      .catch((error) => {
        console.error('Error fetching search results:', error)
      })
  })

  // Hide suggestions when clicking outside
  document.addEventListener('click', (event) => {
    if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
      suggestionsContainer.style.display = 'none'
    }
  })
})
