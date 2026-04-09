import os

class TravelPlanner:
    def __init__(self):
        self.flights = []
        self.hotels = []
        self.activities = []

    def plan_trip(self, destination, start_date, end_date, budget):
        """
        Plans a trip to a given destination with a specified budget and dates.
        """
        print(f"Planning a trip to {destination} from {start_date} to {end_date} with a budget of {budget}.")
        self.find_flights(destination, start_date, end_date)
        self.find_hotels(destination, start_date, end_date)
        self.find_activities(destination)
        self.generate_itinerary()

    def find_flights(self, destination, start_date, end_date):
        """
        Finds flights to the destination for the given dates.
        """
        print(f"Finding flights to {destination} from {start_date} to {end_date}.")
        # In a real implementation, this would call a flight API
        self.flights.append({"airline": "Example Air", "price": 500})

    def find_hotels(self, destination, start_date, end_date):
        """
        Finds hotels in the destination for the given dates.
        """
        print(f"Finding hotels in {destination} from {start_date} to {end_date}.")
        # In a real implementation, this would call a hotel API
        self.hotels.append({"name": "Example Hotel", "price_per_night": 150})

    def find_activities(self, destination):
        """
        Finds activities in the destination.
        """
        print(f"Finding activities in {destination}.")
        # In a real implementation, this would call an activity API
        self.activities.append({"name": "Example Activity", "price": 50})

    def generate_itinerary(self):
        """
        Generates a travel itinerary based on the found flights, hotels, and activities.
        """
        print("Generating itinerary:")
        for flight in self.flights:
            print(f"- Flight with {flight['airline']} for ${flight['price']}.")
        for hotel in self.hotels:
            print(f"- Hotel: {hotel['name']} at ${hotel['price_per_night']} per night.")
        for activity in self.activities:
            print(f"- Activity: {activity['name']} for ${activity['price']}.")

if __name__ == "__main__":
    planner = TravelPlanner()
    planner.plan_trip("Paris", "2024-10-26", "2024-11-02", 2000)
