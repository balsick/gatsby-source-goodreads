# gatsby-source-goodreads

Source plugin for pulling your shelved books into Gatsby from Goodreads API.

## How to use
Install the plugin
```sh
npm i @balsick/gatsby-source-goodreads
```
Then configure the plugin in `gatsby-config.js`
```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: "@balsick/gatsby-source-goodreads",
      options: {
        developerKey: "IAmDeveloperKey",
        goodReadsUserId: "IAmGoodreadsUserId",
        userShelf: "to-read" //optional
        userShelves: ['to-read','currently-reading','custom-shelf',...] //optional
      }
    }
  ],
}
```

## Plugin options

* **developerKey**: Use your [Goodreads developer API key](https://www.goodreads.com/api/keys)
* **goodReadsUserId**: The Goodreads user ID of the user to get data for.
* **userShelf**: _OPTIONAL_. read, currently-reading, to-read, etc.
* **userShelves**: _OPTIONAL_. An array containing the names of the shelves to query.

If neither **userShelf** nor **userShelves** are set, all the user shelves are queried.

## How to query your Goodread data using GraphQL

Below is a sample query for fetching the shelf's books. 

```graphql
query goodRead {
  goodreadsShelves {
    goodreadsShelf {
      shelfName
      reviews {
        book {
          title
          smallImageUrl
          link
          description
        }
        dateAdded
        rating
      }
    }
  }
}
```

## Data structure

You can query all the set shelves, some shelves only or a single shelf.
For querying a single shelf, a query like this can be used.

```graphql
query goodRead {
  goodreadsShelf(shelfName: {eq: "to-read"}) {
    shelfName
    reviews {
      reviewID
      rating
      votes
      spoilerFlag
      spoilersState
      dateAdded
      dateUpdated
      book {
        bookID
      }
    }
  }
}
```
