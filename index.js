// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {google} = require('googleapis');
const calendar = google.calendar('v3');
const {WebhookClient} = require('dialogflow-fulfillment');
const calendarId = "us5n7gdijfjud94992j9qu4fgk@group.calendar.google.com";
const calendarID = 'us5n7gdijfjud94992j9qu4fgk@group.calendar.google.com';

const private_key_id = process.env.private_key_id;
const private_key = process.env.private_key;
const serviceAccount = {
  "type": "service_account",
  "project_id": "restaurant-booking-7e726",
  "private_key_id": private_key_id,
  "private_key": private_key,
  "client_email": "restaurant-booking-calendar@restaurant-booking-7e726.iam.gserviceaccount.com",
  "client_id": "105805538511090550919",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/restaurant-booking-calendar%40restaurant-booking-7e726.iam.gserviceaccount.com"
};

// Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: 'https://www.googleapis.com/auth/calendar'
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase); 
var db = admin.firestore();
db.settings({timestampsInSnapshots: true});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {  	
  const agent = new WebhookClient({ request, response });
  const adults = agent.parameters.adults;
  const children = agent.parameters.children;
  const currentTime = new Date();
  const maxGuest = 100;
  const FieldValue = admin.firestore.FieldValue;
  var lastName = agent.parameters.lastName;
  var mobile = agent.parameters.mobile;
  var last3Digits = mobile.substring(mobile.length, mobile.length - 3);
  var time = agent.parameters.time || new Date();
  var date = agent.parameters.date || new Date();
  var startTime = new Date(date.toString() + " " + time.toString() + "+10:00");
  var endTime = getEndTime(startTime);
  var event = {
    'summary': `${lastName}, ${mobile} books for ${adults} adults and ${children} children`,
    'start': {
      'dateTime': startTime
    },
    'end': {
      'dateTime': endTime
    },
  };
  var userId = lastName + last3Digits.toString();
  var meal = getTimeSlot(); 
  var dateRef = date.toString() + "-" + meal;
  var currentTotalGuest = getTotalGuest();    
  
  //This function is used for error prevention, if not it will create an event in Google Calendar.
  function createBooking(agent) { 
    //Check if there are enough seats to make a booking.
    currentTotalGuest.then(function(value) {
      var newTotalGuest = value + adults;
      if (newTotalGuest > maxGuest) {
        agent.add(`There are not enough seats for your booking.`);
      } else if (adults < 1) {
        agent.add('Invalid number of guests. You need to reserve a table for at least one guest. Please try again.');
      } else if (adults > maxGuest) {
        agent.add(`We only serve ${maxGuest} at a time.`);
      } else if (startTime < currentTime) {
        agent.add('Invalid date. Please make a reservation in near future.');
      } else if (!isOpen(startTime)) {
        agent.add(`We are closed at ${time}. Our opening hours are 10am-3pm for lunch and 5pm-9pm for dinner.`);
      } else {
        return new Promise((resolve, reject) => {
          calendar.events.insert({
              auth: serviceAccountAuth,
              calendarId: calendarId,
              resource: event, 
          }, function(err, response) {
              if (err) {
                console.error('There was an error contacting the Calendar service: ' + err);
                agent.add('Your request cannot be handled. Please try again later.');
                reject(err);
              } else {
                var eventId = response.data.id;
                console.log('Event created: ' + eventId);       
                saveBooking(userId, eventId); 
                agent.add(`${lastName}, mobile number ${mobile} booked for ${adults} adults and ${children} children at ${time} on ${date}. Your booking Id is ${userId}. Please keep this for updating or cancellation.`);
                resolve(event); 
              }
          });
        });
      }
    });
    agent.add();
  }
  
  //This function takes the event ID and delete the corresponding event in Google Calendar
  function cancelBooking(agent) {
    var userId = agent.parameters.eventID;
    var eventId = getEventId();
    eventId.then(function(value) {
      eventId = value;
      if (eventId == " ") {
        agent.add(`Id ${userId} is invalid. Please try again!`);
      } else {
        db.collection(dateRef).doc(userId).delete();
        calendar.events.delete({auth: serviceAccountAuth, calendarId: calendarID, eventId: eventId});
        agent.add('Your booking has been cancelled!');
      }
    });
  }
  
  //This function update the event on request.
  function updateBooking(agent) {
    var newEventId;
    agent.add(`Successful! Your new booking Id is ${newEventId}`);
  }
  
  //This function provides the menu on request.
  function menuRequest(agent) {
    const menuLink = "https://tinyurl.com/y6bvcmzd";
    agent.add('Please click on the following link to see the menu');
    agent.add(menuLink);
  }
	
  //This function return the price of the specific dish on request
  function dishPrice(agent) {
    var priceList = new Map();
    priceList.set('caesar salad', "18$");
    priceList.set('house salad', "18$");
    priceList.set('eggplant parmigiana', "25$");
    priceList.set('chicken parmigiana',"25$");
    priceList.set('chicken noodle soup',"17$");
    priceList.set('margherita',"19$");
    priceList.set('bbq chicken',"19$");
    priceList.set('beef pepperoni',"19$");
    priceList.set('roasted veg',"19$");
    priceList.set('hawaiian',"19$");
    priceList.set('four cheese',"19$");
    priceList.set('ham and mushroom',"19$");
    priceList.set('chicken fettuccine',"24$");
    priceList.set('spaghetti with meatballs',"20$");
    priceList.set('baked macaroni',"20$");
    priceList.set('penne with tomato and basil',"23$");
    priceList.set('prawn pasta',"25$");
    priceList.set('pesto fettuccine',"22$");
    priceList.set('risotto',"24$");
    priceList.set('soft drinks',"6$");
    priceList.set('fresh juice',"6$");
    priceList.set('cocktails',"16$");
    priceList.set('wine',"10$");
    priceList.set('spirits',"10$");
    var dish = agent.parameters.dish;
    var price = priceList.get(dish.toLowerCase());
    agent.add(`The price of ${dish} is ${price}`);
  }
  
  //This function checks if the booking time is in the opening hours of the restaurant.  
  function isOpen(startTime) {
    let checkedTime = startTime.getHours() + 10;
    return ((checkedTime >= 9 && checkedTime <= 15) || (checkedTime >= 17 && checkedTime <= 21));  
  }
  
  //This function get the end time of the booking
  function getEndTime() {
  	if (isLunch()) 
      return new Date(new Date(startTime).setHours(15 - 10));
    return new Date(new Date(startTime).setHours(21 - 10));    
  }
  
  //This functions checks whether the booking time is lunch time or dinner time.  
  function isLunch() {
    let checkedTime = startTime.getHours() + 10;
    return checkedTime >= 9 && checkedTime < 15;
  }

  //This function return the name of the time slot
  function getTimeSlot() {
    if (isLunch()) 
      return "lunch";
    return "dinner";
  }

  //This function get the value of eventId in the firestore
  function getEventId() {
    return new Promise((resolve) => {
      db.collection(dateRef).doc(userId).get()
        .then(doc => {
          if(!doc.exists) {
            console.log("No event ID found");
            resolve(" ");
          } else {
            console.log("Event Id is: ", doc.data().eventId.toString());
            resolve(doc.data().eventId.toString());
          }
      });
    });
  }

  //This function get the value of total guest in the firestore
  function getTotalGuest() {
    return new Promise((resolve) => {
      db.collection(dateRef).doc("totalGuest").get()
      .then(doc => {
        if (!doc.exists) {
          console.log("No booking at " + dateRef);
          resolve("0");
        } else {
          console.log("Document: " + doc.data().totalGuest);
          resolve(doc.data().totalGuest.toString());
        }
      });
    });
  }
  
  //This function save the booking data in firestore
  function saveBooking(userId, eventId) {
    try {
      var booking = {
        eventId: eventId, 
        adults: adults,
        timestamp: FieldValue.serverTimestamp()
      };
      currentTotalGuest.then(function(value) {
        var newTotalGuest = value + adults;
        console.log(newTotalGuest);
        db.collection(dateRef).doc("totalGuest").set({totalGuest: newTotalGuest});
        db.collection(dateRef).doc(userId).set(booking);
      });
    } catch(e) {
    	console.error("Error saving data: ", e);
    }
  }

  //Map the intent with its corresponding function in fulfillment.
  let intentMap = new Map();
  intentMap.set('restaurant.book', createBooking);
  intentMap.set('restaurant.cancellation', cancelBooking);
  intentMap.set('restaurant.update', updateBooking);
  intentMap.set('restaurant.menu', menuRequest);
  intentMap.set('restaurant.dishPrice', dishPrice);
  agent.handleRequest(intentMap);
});  


// *** Sample commands ***
// Nguyen, 0416533779 book a table for 5 adults and 5 children at 18 tomorrow 
// i want to cancel a booking 
// i want to see the menu
// how much does risotto cost?
