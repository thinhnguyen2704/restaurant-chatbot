# Restaurant booking chatbot
  Restaurant chatbot will help the customers to create and manage their booking at the restaurant using Facebook Messenger. It is developed with Google Dialogflow and Node.js. 
  The chatbot has three functionalities create, manage and delete booking.
## Functionalities:
### 1. Make reservation
<img width="289" alt="image" src="https://user-images.githubusercontent.com/20553722/215365433-fb8921c7-5b80-4909-8832-9981d450055c.png">
<img width="289" alt="image" src="https://user-images.githubusercontent.com/20553722/215365462-953fe5d8-a306-4ebb-8aed-a77638592e95.png">
  This bot creates bookings for customers by asking for the number of guests (both adults and children) then proceeds to asks for the date and time and then asks for the last name and mobile number of the customer to make a reservation. The customer received a booking receipt which confirms their last name, mobile number, numbers of adults and children, the time and date and also provides a unique booking ID for future changes or cancellation of the booking.

### 2. Change reservation
<img width="235" alt="image" src="https://user-images.githubusercontent.com/20553722/215365608-1b52fb42-a158-4919-8040-b690cdf73716.png">
<img width="235" alt="image" src="https://user-images.githubusercontent.com/20553722/215365626-85c8c8b8-0b49-432f-bce9-518c37cae255.png">
  The customers can easily change their booking by providing their booking ID which they received when they initially made the booking. The chatbot then verifies with the customer the booking date and time and then proceeds to ask if the customer wants to change the amount of people attending, the date and the time. The chatbot outputs a booking confirmation receipt with the new number of guests, time and date.
  
### 3. Cancel reservation
<img width="179" alt="image" src="https://user-images.githubusercontent.com/20553722/215365790-4e8b284b-6c45-4ea3-8ab4-695629dbf105.png">
  To cancel the booking, the user simply provides their reservation ID, verifies booking date and time and notifies the user of the cancellation.

### 4. Display Menu
<img width="188" alt="image" src="https://user-images.githubusercontent.com/20553722/215365839-17dcaacc-d8ea-4904-ba76-99062c4567c8.png">
  Customers can ask the chatbot to see the menu and a link to the menu will be presented.
  
### 5. Show Price
  <img width="235" alt="image" src="https://user-images.githubusercontent.com/20553722/215365928-d7fb5939-a323-4f29-81d7-dfefd1df8338.png">
  This function will show the user the price of any item on the menu.
