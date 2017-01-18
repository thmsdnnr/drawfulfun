#LEARNING NODE.JS

First big "MEEN" stack project using MongoDB for image storage (indexing filenames, image metadata, and userinfo to fetch things from the file system, express JS for serving up and routing, and Embedded Java Script currently for the view (hence MEEN instead of MEAN). Plan to deploy on Heroku when more stable. Right now working on adding additional features and small bug fixes. Learning tons!

##QUICK WINS
[ ] Set the min and max brush sizes for the sliders relative to the image at hand to make them usable! :)
[ ] Custom SVG buttons for toolbar?
[ ] When line-width is close to zero it looks funny. It can't be zero, but if we make it too small sometimes there's aliasing.
[ ] Save-as Box Resizes Uglily.
[ ] Filename autofocus doesn't work
[ ] Style input box with pretty text and such
[ ] Maybe canvas message for "PICASSO" was saved succesfully, or overwritten, or what have your

[ ] Camera-roll like display toggle of user images using AJAX so you don't have to visit a separate page
[ ] Or just visit the separate page in a div or iframe

##ROTATION THINGS&BUGS
[ ] First UNDO step does not work
[ ] UNDO/REDO doesn't work for canvas rotations
[ ] Change rotation to just be 90degrees left / 90 degres right, and then mirror horizontal, mirror vertical

#optimizations and stuff

[ ] -> Display file name on user pages

[ ] -> Make sure your IDs are actually unique and won't generate collisions!
[ ] -> Maybe generate small image thumbnail for larger galleries on image save and put a thumbSrc in the DB row so we can display without having to pull the big image from the Fs and then resize
[ ] Better toolbar UI
[ ] Make movable/resizable
[ ] Add ability to "nest" or "dock" (stickyness)


[ ] Filter 'preview' gallery maybe
[ ] For the filter fill colors, like say lighten, take an average of the information in the overlaid region.
[ ] Modal with pretty window-size dragging / validation / etc.


[ ] //http://expressjs-book.com/index.html%3Fp=128.html Implementing sessions with a Redis session store or a MongoDB session store
[ ] Can leave canvas as it was so when you log back in the canvas is in that state.

[ ] Color palettes
[ ] Keyboard toggle for circle radius up/down
[ ] Toggle-able jitter function + jitter "amount/range"
[ ] Make jitter global and be able to control jitter params
[ ] Maybe make jitter only part of automatic mode
[ ] Have a text write function or a text brush
[ ] http://stackoverflow.com/questions/39029893/why-is-the-mongodb-node-driver-generating-instance-pool-destroyed-errors
[ ] ALL the FILTERS
[ ] Selective filter application to "regions" of the canvas
[ ] Text tool (font face, font size, text input)
[ ] Random size on-off
[ ] Random colors on-off
[ ] Sliders for random size range
[ ] Background-color changer

API Integration
[ ] Store IMGUR links in the DB
[ ] Grab random unsplash.it image based on user size input on landing screen using the API
[ ] Share on Twitter
[ ] Share on FB
[ ] Share on Instagram

Cross-App integration
[ ] Support multiple file-type save modes

###User image page/sessions:
[ ] Conditiional button if uploaded to IMGUR to manage IMGUR link
  -> back-end: store imgur link in image collection w/images
  -> store imgur deletion code on back-end as well
  -> store "canvas preferences"
  -> mode to "save canvas preferences/set-up to come back, maybe have a list"
  -> canvas/image effects, transformations, define-your-own transform matrix, etc.
[ ] Login session cookie
[ ] Logout button that actually functions haha
[ ] Can have a Login-meta collection w/ stuff like login count, last logged in time, user metadata (not creepy tho!), etc.
[ ] favorite tools, etc. tool-tips based on previous drawing behavior or brand new things!

[ ] Admin login with a "management console":
 ->view all images with option to delete
 ->view all users with data and option to delete
[ ] HTML5 tooltip "pop-over" with "Got it" and then "okay"

###Canvas enhancements
[ ] Select region and then copy-paste
[ ] Select region and then selectively-apply effects
-> Make sure undo only works on those regions (mask?)
[ ] Offer filter and collage operations
[ ] Better SVG filters
[ ] Randomization seed from sentences etc. -> Randomly filter / art/make image from tweet text or random strings
-> Will need to sanitize the input

###the long game
[ ] Mobile-friendly/small screen friendly bc right now uh no.
[ ] App path of usernames with a user page of images and cool stuff like that
[ ] Maybe look at modularizing the FS stuff in addition to the db stuff.
[ ] Make sure that you're using asynchronous everything!
[ ] Maybe look at a different way of doing state storage for the app.
[ ] DRY YAGI etc.
[ ] More functional code, yet still separation of concerns w/good decoupling
[ ] A little layers box with transparency
[ ] SVG support (but make sure you don't recreate that thing that already exists)

#HANDWAVEY BIG PICTURE
[ ] Selective "region" application of filters, composite blend, etc., masking effects
[ ] Have generative art functions
[ ] Have more collage functions
[ ] More image export modes
[ ] Prettier image storage than base64 PNG!
[ ] Actual BRUSHES that can be user-defined
[ ] Image comparison?
[ ] Latte-art mode
[ ] Mark Rothko mode

* handy mongo misc commands
listen(): bind() failed Address already in use for socket: 0.0.0.0:27017
ps wuax | grep mongo
kill PID associatd with Mongo

mongod --dbpath ./mongodata

###Canvas mods:
##COMPLETED 💥
[X] Add listener to the canvas so when mouseleave the "potential" next event disappears
[X] Last saw you here at 6:8! [zero pading minutes, non-24hr time hours
[X] Undo mode:
1. Array of previous canvases
2. Last 5 steps say
3. Push current state on. If length = max, Array.shift() to throw off oldest state, Array.push() to push on the newest
4. To step back in time with undo, for each push of undo button, set current canvas state to Array[Array.length-(1+#undoPresses)] until we get back to zero, then "no more undo steps"
5. For redo to step forward in time, set canvas state to Array[<undoState>+REDO PRESSES] until <undoState>+REDO PRESSES = Array.length-1.
6. CS.undoState = 0 initially, CS.undoArr=[] initially.
[X] Redo mode (reverse above)
[X] Cursor preview for filter application. STEPS:
 0. Make cursor the size of the brush/effect before the effect is clicked to the canvas.
 1. Create a mask the size of the cursor.
 2. Apply currently selected effect to the masked area.
 3. "Print" to canvas but don't save unless clicked.
 -> The challenge here was that stacking two canvases on top of one another made the lower canvas not receive my mouse events due to the way I was querySelector-ing things.
[X] Toggle-able mouse "Velocity" or basically fire-frequency
[X] Maybe make square single-draw at center of square instead of upper-left corner
[X] Canvas Rendering Context 2D Global Composite Blending operations
[X] Break up the mouse-down / mouse-drag code, DRY DRY DRY!
[X] A brush is basically just an X-Y matrix with defined opacities and transformations at each x-y, no?
e.g., brush: MxN array of 0 or 1 for paint pixel or don't paint pixel. M = CS.radius
0 0 0 0 0
0 0 0 0 0
0 0 0 0 0
0 0 0 0 0
0 0 0 0 0
[X] Mouse velocity-driven line width
[X] Pen mode
[X] Shape mode
[X] Image gallery
[X] Time of login: e.g., "Welcome back! you were last here on . . ."
[X] Turn off the randomness
[X] Destination-in tends to crash the app.
[X] Better tool display (hoverable div perhaps relative positioned to the right border of the canvas)
[X] Save file modal pop in middle of canvas, ask for name to save.
[X] -> Leave Fs naming the same. The Db just maps names for a user's files to a unique ID
[X] -> In Db AND Fs, map "user" file name to a unique imgSrc so two files can have the same (imgName) without conflicts


#NOTES
http://www.nodebeginner.org/#javascript-and-nodejs

"We want to serve web pages, therefore we need an HTTP server
Our server will need to answer differently to requests, depending on which URL the request was asking for, thus we need some kind of router in order to map requests to request handlers
To fulfill the requests that arrived at the server and have been routed using the router, we need actual request handlers
The router probably should also treat any incoming POST data and give it to the request handlers in a convenient form, thus we need request data handling
We not only want to handle requests for URLs, we also want to display content when these URLs are requested, which means we need some kind of view logic the request handlers can use in order to send content to the user's browser
Last but not least, the user will be able to upload images, so we are going to need some kind of upload handling which takes care of the details"

* git diff --stat `git hash-object -t tree /dev/null` a useful tool to see lines of code changed between commits

# LEARNINGS

*  mongoConnect(function(m){console.log(m);},{userkname:"avery"});

If you mistype a data parameter MONGO will return EVERYTHING. This could result in really undesirable behavior. So make sure your parameters are typed correctly.

* "This can cause the remote repository to lose commits; use it with care.
If you do not wish to merge the remote branch into your local branch (see differences with git diff), and want to do a force push, use the push command with -f

git push -f origin <branch>
where origin is the name of your remote repo."
(http://stackoverflow.com/questions/10298291/cannot-push-to-github-keeps-saying-need-merge)[http://stackoverflow.com/questions/10298291/cannot-push-to-github-keeps-saying-need-merge]

# MONGO shell commands

* show dbs ->list of databases
* use <DB NAME> -> switch to db
* when in a db, `show collections` -> shows collections in the db
* when in a db, db.[COLLECTIONNAME].find() -> shows all items.
* can specify query parameters in the find() e.g., {user:"name"}

* [X] you should also close your connections after you open them so they don't accumulate

* http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
