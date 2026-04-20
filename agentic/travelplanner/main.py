class TravelPlanner:
    def __init__(self):
        self.destination = None
        self.departure_date = None
        self.return_date = None

    def get_user_input(self):
        self.destination = input("Enter your destination: ")
        self.departure_date = input("Enter your departure date (YYYY-MM-DD): ")
        self.return_date = input("Enter your return date (YYYY-MM-DD): ")

    def search_flights(self):
        print(f"Searching for flights to {self.destination} from {self.departure_date} to {self.return_date}")

    def search_hotels(self):
        print(f"Searching for hotels in {self.destination} from {self.departure_date} to {self.return_date}")

    def search_rental_cars(self):
        print(f"Searching for rental cars in {self.destination} from {self.departure_date} to {self.return_date}")

    def search_activities(self):
        print(f"Searching for activities in {self.destination}")

def main():
    planner = TravelPlanner()
    planner.get_user_input()
    planner.search_flights()
    planner.search_hotels()
    planner.search_rental_cars()
    planner.search_activities()

if __name__ == "__main__":
    main()
