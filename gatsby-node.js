const axios = require(`axios`)
const crypto = require(`crypto`)
const parseString = require('xml2js').parseString

exports.sourceNodes = async ({
  boundActionCreators,
  reporter
},
  {
    goodReadsUserId,
    userShelves = [],
    userShelf = '',
    developerKey = ''
  }) => {
  const { createNode } = boundActionCreators

  activity = reporter.activityTimer(`fetching goodreads shelf`);
  activity.start();

  let shelves = [];
  let shelvesByName = {};
  if (!userShelves || userShelves.length === 0) {
    if (userShelf && userShelf.length > 0)
      userShelves = [userShelf];
    else {
      const options = {
        method: 'get',
        url: 'https://www.goodreads.com/shelf/list.xml',
        params: {
          key: developerKey,
          user_id: goodReadsUserId
        }
      }
      const shelfsListXml = await axios(options);
      console.log(`shelf/list responded ${shelfsListXml.status}`)
      if (shelfsListXml.status !== 200) 
        reporter.panic(`gatsby-source-goodreads: Failed API call -  ${shelfsListXml}`)
      else {
        parseString(shelfsListXml.data, function (err, result) {
          if (err) {
            reporter.panic(`gatsby-source-goodreads: Failed to parse API call -  ${err}`)
          } else {
            if (Object.keys(result['GoodreadsResponse']['shelves'][0]['user_shelf'] || {}).length === 0) {
              return
            }
            shelves = result['GoodreadsResponse']['shelves'][0]['user_shelf'].map(element => {
              return {
                shelfId: element['id'][0]._,
                shelfName: element['name'][0],
                book_count: element['book_count'][0]._,
              }
            })
            shelves.forEach(element => {
              shelvesByName[element.shelfName] = element;
              userShelves.push(element.shelfName);
            });
          }
        })
        createNode({
          goodreadsShelf___NODE: userShelves.map(element => `${goodReadsUserId}-${element}`),
          shelves: shelves,
          parent: null,
          children: [],
          id: `shelves${goodReadsUserId}`,
          internal: {
            type: `goodreadsShelves`,
            contentDigest: crypto
              .createHash(`md5`)
              .update('shelves' + goodReadsUserId)
              .digest(`hex`)
          }
        })
      }
    }
  }

  for (let userShelf of userShelves) {
    const shelfReviewId = `${goodReadsUserId}-${userShelf}`
    let reviewListings = [];
    for (var index = 0; index < 999999; index++) {
      const options = {
        method: `get`,
        url: `https://www.goodreads.com/review/list`,
        params: {
          id: goodReadsUserId,
          shelf: userShelf,
          v: `2`,
          key: developerKey,
          per_page: 200,
          page: index + 1
        }
      }
      const shelfListXml = await axios(options)

      if (shelfListXml.status !== 200) {
        if (index > 0) {
          reporter.panic(`gatsby-source-goodreads: Failed API call -  ${shelfListXml}`)
        }
        index = 999999
        break;
      }

      parseString(shelfListXml.data, function (err, result) {
        if (err) {
          reporter.panic(`gatsby-source-goodreads: Failed to parse API call -  ${err}`)
          return
        }
        if (Object.keys(result['GoodreadsResponse']['reviews'][0]['review'] || {}).length === 0) {
          index = 999999
          return
        }
        reviewListings = [...reviewListings, ...result['GoodreadsResponse']['reviews'][0]['review'].map(element => {
          var bookElement = element['book'][0]

          var isbnValue = bookElement['isbn'][0]
          var isbn13Value = bookElement['isbn13'][0]
          if (isNaN(isbnValue)) {
            isbnValue = null
          }
          if (isNaN(isbn13Value)) {
            isbn13Value = null
          }

          return {
            reviewID: element['id'][0],
            rating: element['rating'][0],
            votes: element['votes'][0],
            spoilerFlag: element['spoiler_flag'][0],
            spoilersState: element['spoilers_state'][0],
            dateAdded: element['date_added'][0],
            dateUpdated: element['spoilers_state'][0],
            body: element['body'][0],
            book: {
              bookID: bookElement['id'][0]._,
              isbn: isbnValue,
              isbn13: isbn13Value,
              textReviewsCount: bookElement['text_reviews_count'][0]._,
              uri: bookElement['uri'][0],
              link: bookElement['link'][0],
              title: bookElement['title'][0],
              titleWithoutSeries: bookElement['title_without_series'][0],
              imageUrl: bookElement['image_url'][0],
              smallImageUrl: bookElement['small_image_url'][0],
              largeImageUrl: bookElement['large_image_url'][0],
              description: bookElement['description'][0]
            }
          }
        })]
      })
    }

    createNode({
      shelfName: userShelf,
      reviews: reviewListings,

      id: shelfReviewId,
      parent: null,
      children: [],
      internal: {
        type: `goodreadsShelf`,
        contentDigest: crypto
          .createHash(`md5`)
          .update('shelf' + goodReadsUserId)
          .digest(`hex`)
      }
    })
  }
    
  activity.end()

  return
}