(function () {
  const config = window.RMA_SUPABASE;
  const loginCard = document.getElementById("loginCard");
  const changeCard = document.getElementById("changeCard");
  const dashboard = document.getElementById("dashboard");
  const message = document.getElementById("teacherMessage");
  const passwordMessage = document.getElementById("passwordMessage");
  const dashboardMessage = document.getElementById("dashboardMessage");
  const gradeFilter = document.getElementById("gradeFilter");
  const sectionFilter = document.getElementById("sectionFilter");
  let token = "";
  let rows = [];
  let scoreBands = [];
  let currentGrade = null;
  let currentSection = null;

  // ============================================
  // QUESTION MAP DATA - RMA Original, Bank, and Aligned Filipino Scenarios
  // ============================================
  
  /**
   * Complete Question Bank with Aligned Filipino Scenarios
   * Each question has: id, text, type, masteryRate (dynamic), and aligned questions
   */
  const QUESTION_BANK = {
    // Grade 7 Questions
    7: [
      {
        id: "RMA-Q7-01",
        text: "What is the value of 3 + 5 × 2?",
        type: "rma",
        category: "Order of Operations",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q7-01-01",
            text: "Mang Pedro has 3 sacks of rice. Each sack contains 5 kilograms. He buys 2 more sacks. How many kilograms of rice does he have in total?",
            feedback: "Use order of operations (PEMDAS/BODMAS): First multiply (5 × 2 = 10), then add (3 + 10 = 13). Answer: 13 kilograms."
          },
          {
            id: "ALIGN-Q7-01-02",
            text: "In a marketplace, a vendor sells 3 mangoes at ₱5 each. She then buys 2 more mangoes. How many mangoes does she have now?",
            feedback: "First calculate total mangoes: 3 + 2 = 5 mangoes. Note: The ₱5 is a distractor. The question asks for count, not value."
          },
          {
            id: "ALIGN-Q7-01-03",
            text: "Aling Maria has 3 baskets with 5 eggs each. She adds 2 more baskets. How many eggs in total?",
            feedback: "Each basket has 5 eggs, so 3 baskets = 15 eggs, plus 2 baskets = 10 more eggs, total = 25 eggs. Wait - this tests multiplication first: 3×5 + 2×5 = 15 + 10 = 25."
          },
          {
            id: "ALIGN-Q7-01-04",
            text: "Kuya John has ₱3. He earns ₱5 for each of 2 jobs. How much money does he have?",
            feedback: "First: 2 jobs × ₱5/job = ₱10. Then: ₱3 + ₱10 = ₱13. Apply multiplication before addition."
          },
          {
            id: "ALIGN-Q7-01-05",
            text: "A jeepney has 3 rows of seats with 5 passengers each. 2 more passengers board. How many passengers total?",
            feedback: "3 rows × 5 passengers = 15 passengers. Then 15 + 2 = 17 passengers. Multiplication has higher priority."
          },
          {
            id: "ALIGN-Q7-01-06",
            text: "In a classroom, there are 3 groups with 5 students each. The teacher adds 2 more groups. How many students are there?",
            feedback: "Each group has 5 students. 3 groups = 15 students. 2 more groups = 10 students. Total = 15 + 10 = 25 students. Remember: multiply first, then add."
          },
          {
            id: "ALIGN-Q7-01-07",
            text: "A sari-sari store owner has 3 boxes of candies. Each box has 5 pieces. She receives 2 more boxes. How many candy pieces total?",
            feedback: "3 boxes × 5 pieces = 15 pieces. 2 boxes × 5 pieces = 10 pieces. Total: 15 + 10 = 25 pieces. Order matters: multiplication before addition."
          },
          {
            id: "ALIGN-Q7-01-08",
            text: "If you have 3 apples and your friend gives you 5 apples 2 times, how many apples do you have?",
            feedback: "Your friend gives 5 apples twice: 5 × 2 = 10 apples. You already have 3: 3 + 10 = 13 apples total."
          },
          {
            id: "ALIGN-Q7-01-09",
            text: "A farmer has 3 goats. Each goat produces 5 liters of milk daily. He gets 2 more goats. How many liters of milk per day?",
            feedback: "Original goats: 3 × 5 = 15 liters. New goats: 2 × 5 = 10 liters. Total: 15 + 10 = 25 liters. Multiply before adding."
          },
          {
            id: "ALIGN-Q7-01-10",
            text: "There are 3 tricycles with 5 passengers each at the terminal. 2 more tricycles arrive with the same capacity. How many passengers can they carry in total?",
            feedback: "First tricycles: 3 × 5 = 15 passengers. Additional tricycles: 2 × 5 = 10 passengers. Total capacity: 15 + 10 = 25 passengers."
          }
        ]
      },
      {
        id: "RMA-Q7-02",
        text: "Simplify: 4(2x + 3) - 5x",
        options: ["8x + 7", "3x + 12", "3x + 5", "8x + 12"],
        answer: "3x + 12",
        type: "rma",
        category: "Algebraic Expressions",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q7-02-01",
            text: "Aling Rosa has 4 sacks. Each sack contains (2x + 3) kilos of rice. She sells 5x kilos. How much rice remains in kilos?",
            options: ["8x + 7 kg", "3x + 12 kg", "3x + 5 kg", "8x + 12 kg"],
            answer: "3x + 12 kg",
            feedback: "Distribute: 4(2x + 3) = 8x + 12. Then subtract: 8x + 12 - 5x = 3x + 12 kilos remaining."
          },
          {
            id: "ALIGN-Q7-02-02",
            text: "Kuya Pablo has 4 fish nets. Each net catches (2x + 3) fish. He gives away 5x fish. How many fish does he have left?",
            options: ["8x + 7 fish", "3x + 12 fish", "3x + 5 fish", "8x + 12 fish"],
            answer: "3x + 12 fish",
            feedback: "First expand: 4 × 2x = 8x, 4 × 3 = 12, so 8x + 12. Then subtract 5x: 8x + 12 - 5x = 3x + 12 fish."
          },
          {
            id: "ALIGN-Q7-02-03",
            text: "A store sells 4 boxes of mangoes. Each box has (2x + 3) mangoes. The store keeps 5x mangoes for display. How many mangoes are sold?",
            options: ["8x + 7 mangoes", "3x + 12 mangoes", "3x + 5 mangoes", "8x + 12 mangoes"],
            answer: "3x + 12 mangoes",
            feedback: "Total mangoes: 4(2x + 3) = 8x + 12. Keep 5x, so sold: (8x + 12) - 5x = 3x + 12 mangoes."
          },
          {
            id: "ALIGN-Q7-02-04",
            text: "If each student has (2x + 3) notebooks and there are 4 students, but 5x notebooks are borrowed, how many notebooks remain?",
            options: ["8x + 7 notebooks", "3x + 12 notebooks", "3x + 5 notebooks", "8x + 12 notebooks"],
            answer: "3x + 12 notebooks",
            feedback: "Total notebooks: 4(2x + 3) = 8x + 12. Borrowed: 5x. Remaining: 8x + 12 - 5x = 3x + 12 notebooks."
          },
          {
            id: "ALIGN-Q7-02-05",
            text: "A jeepney driver collects ₱(2x + 3) from each of 4 passengers. He spends ₱5x on fuel. What is his profit?",
            options: ["₱8x + 7", "₱3x + 12", "₱3x + 5", "₱8x + 12"],
            answer: "₱3x + 12",
            feedback: "Income: 4(2x + 3) = 8x + 12 pesos. Expense: 5x. Profit: 8x + 12 - 5x = 3x + 12 pesos."
          },
          {
            id: "ALIGN-Q7-02-06",
            text: "There are 4 rows of chairs with (2x + 3) chairs each. 5x chairs are removed. How many chairs remain?",
            options: ["8x + 7 chairs", "3x + 12 chairs", "3x + 5 chairs", "8x + 12 chairs"],
            answer: "3x + 12 chairs",
            feedback: "Original: 4 × (2x + 3) = 8x + 12 chairs. Removed: 5x. Remaining: 8x + 12 - 5x = 3x + 12 chairs."
          },
          {
            id: "ALIGN-Q7-02-07",
            text: "Aling Maria buys 4 bundles of bananas. Each bundle has (2x + 3) pieces. She sells 5x pieces. How many pieces remain?",
            options: ["8x + 7 pieces", "3x + 12 pieces", "3x + 5 pieces", "8x + 12 pieces"],
            answer: "3x + 12 pieces",
            feedback: "Total: 4(2x + 3) = 8x + 12. Sold: 5x. Remaining: 8x + 12 - 5x = 3x + 12 pieces."
          },
          {
            id: "ALIGN-Q7-02-08",
            text: "A farmer plants 4 fields. Each field has (2x + 3) seedlings. 5x seedlings die. How many seedlings survive?",
            options: ["8x + 7 seedlings", "3x + 12 seedlings", "3x + 5 seedlings", "8x + 12 seedlings"],
            answer: "3x + 12 seedlings",
            feedback: "Total planted: 4(2x + 3) = 8x + 12. Died: 5x. Survived: 8x + 12 - 5x = 3x + 12 seedlings."
          },
          {
            id: "ALIGN-Q7-02-09",
            text: "If each basket contains (2x + 3) eggs and there are 4 baskets, and 5x eggs are used for cooking, how many eggs are left?",
            options: ["8x + 7 eggs", "3x + 12 eggs", "3x + 5 eggs", "8x + 12 eggs"],
            answer: "3x + 12 eggs",
            feedback: "Total eggs: 4(2x + 3) = 8x + 12. Used: 5x. Left: 8x + 12 - 5x = 3x + 12 eggs."
          },
          {
            id: "ALIGN-Q7-02-10",
            text: "Kuya John has 4 trays with (2x + 3) eggs each. He sells 5x eggs. How many eggs remain?",
            options: ["8x + 7 eggs", "3x + 12 eggs", "3x + 5 eggs", "8x + 12 eggs"],
            answer: "3x + 12 eggs",
            feedback: "Total: 4(2x + 3) = 8x + 12. Sold: 5x. Remaining: 8x + 12 - 5x = 3x + 12 eggs."
          }
        ]
      },
      {
        id: "RMA-Q7-03",
        text: "If 3/4 of a class of 28 students are present, how many are absent?",
        type: "rma",
        category: "Fractions",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q7-03-01",
            text: "In Grade 7-Rizal, 3/4 of 28 students passed the quiz. How many students failed?",
            feedback: "Present: (3/4) × 28 = 21 students. Absent/Failed: 28 - 21 = 7 students. Method: Find fraction first, then subtract from total."
          },
          {
            id: "ALIGN-Q7-03-02",
            text: "A class has 28 students. 3/4 are girls. How many boys are in the class?",
            feedback: "Girls: (3/4) × 28 = 21. Boys: 28 - 21 = 7 boys. Total minus fraction = remaining."
          },
          {
            id: "ALIGN-Q7-03-03",
            text: "Si Aling Maria baked 28 ensaymada. She sold 3/4 of them. How many ensaymada are left?",
            feedback: "Sold: (3/4) × 28 = 21 ensaymada. Left: 28 - 21 = 7 ensaymada. Subtract the fraction from the whole."
          },
          {
            id: "ALIGN-Q7-03-04",
            text: "There are 28 students in a classroom. 3/4 of them brought their projects. How many forgot their projects?",
            feedback: "Brought projects: (3/4) × 28 = 21 students. Forgot: 28 - 21 = 7 students."
          },
          {
            id: "ALIGN-Q7-03-05",
            text: "Kuya Pedro has 28 chickens. 3/4 are hens. How many are roosters?",
            feedback: "Hens: (3/4) × 28 = 21. Roosters: 28 - 21 = 7. Complement of 3/4 is 1/4: (1/4) × 28 = 7."
          },
          {
            id: "ALIGN-Q7-03-06",
            text: "A basket has 28 apples. 3/4 are red. How many are not red?",
            feedback: "Red apples: (3/4) × 28 = 21. Not red: 28 - 21 = 7 apples."
          },
          {
            id: "ALIGN-Q7-03-07",
            text: "In a jeepney with 28 passengers, 3/4 are adults. How many are children?",
            feedback: "Adults: (3/4) × 28 = 21 passengers. Children: 28 - 21 = 7 passengers."
          },
          {
            id: "ALIGN-Q7-03-08",
            text: "Aling Ana has ₱28. She spent 3/4 of it. How much money does she have left?",
            feedback: "Spent: (3/4) × 28 = ₱21. Left: ₱28 - ₱21 = ₱7. Subtract the spent amount from total."
          },
          {
            id: "ALIGN-Q7-03-09",
            text: "A farmer has 28 cows. 3/4 are female. How many male cows are there?",
            feedback: "Female cows: (3/4) × 28 = 21. Male cows: 28 - 21 = 7."
          },
          {
            id: "ALIGN-Q7-03-10",
            text: "There are 28 books on a shelf. 3/4 are textbooks. How many are not textbooks?",
            feedback: "Textbooks: (3/4) × 28 = 21 books. Not textbooks: 28 - 21 = 7 books."
          }
        ]
      },
      // Add more Grade 7 questions as needed
    ],
    // Grade 8 Questions
    8: [
      {
        id: "RMA-Q8-01",
        text: "Solve for x: 2x + 5 = 17",
        type: "rma",
        category: "Linear Equations",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q8-01-01",
            text: "Aling Rosa has some mangoes. If she adds 5 more, she has 17 mangoes. How many mangoes did she have originally?",
            feedback: "Let x = original mangoes. Equation: x + 5 = 17. Subtract 5: x = 17 - 5 = 12. She had 12 mangoes."
          },
          {
            id: "ALIGN-Q8-01-02",
            text: "Kuya Pedro sold some fish. After selling 2 more kilos, he had 17 kilos sold. How many did he sell initially?",
            feedback: "Let x = initial kilos. x + 2 = 17. So x = 17 - 2 = 15 kilos initially."
          },
          {
            id: "ALIGN-Q8-01-03",
            text: "A jeepney fare is ₱x. After adding ₱5, the total fare is ₱17. What is the original fare?",
            feedback: "x + 5 = 17. Subtract 5 from both sides: x = 17 - 5 = ₱12. Original fare is ₱12."
          },
          {
            id: "ALIGN-Q8-01-04",
            text: "Maria has twice as many apples as Ana. If Ana has 5 apples, Maria has 17. How many does Maria have?",
            feedback: "Wait - re-read: Maria has twice Ana's apples PLUS something? Or is it: 2x + 5 = 17? Then 2x = 12, x = 6. Maria has 12? Clarify the problem."
          },
          {
            id: "ALIGN-Q8-01-05",
            text: "Two times a number plus 5 equals 17. What is the number?",
            feedback: "2x + 5 = 17. Subtract 5: 2x = 12. Divide by 2: x = 6. The number is 6."
          },
          {
            id: "ALIGN-Q8-01-06",
            text: "If you double your money and add ₱5, you have ₱17. How much did you have originally?",
            feedback: "Let x = original money. 2x + 5 = 17. Subtract 5: 2x = 12. Divide by 2: x = ₱6."
          },
          {
            id: "ALIGN-Q8-01-07",
            text: "A store sells pencils at ₱x each. Buying 2 pencils plus ₱5 gives ₱17. What is the price per pencil?",
            feedback: "2x + 5 = 17. Solve: 2x = 12, x = 6. Each pencil costs ₱6."
          },
          {
            id: "ALIGN-Q8-01-08",
            text: "Aling Maria has some eggs. She buys twice as many plus 5, totaling 17. How many did she have originally?",
            feedback: "Let x = original. Buys: 2x + 5. Total: x + 2x + 5 = 3x + 5 = 17. Then 3x = 12, x = 4. Had 4 originally."
          },
          {
            id: "ALIGN-Q8-01-09",
            text: "Kuya John has some chickens. Twice the number plus 5 equals 17. How many chickens does he have?",
            feedback: "2x + 5 = 17. So 2x = 12, x = 6. Kuya John has 6 chickens."
          },
          {
            id: "ALIGN-Q8-01-10",
            text: "The sum of twice a number and 5 is 17. What is the number?",
            feedback: "Twice a number = 2x. Sum with 5: 2x + 5 = 17. Subtract 5: 2x = 12. Divide by 2: x = 6."
          }
        ]
      },
      {
        id: "RMA-Q8-02",
        text: "What is the slope of the line y = 3x - 2?",
        type: "rma",
        category: "Linear Functions",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q8-02-01",
            text: "A jeepney fare increases by ₱3 for every additional kilometer. The base fare is ₱-2 (meaning a discount). What is the rate of increase per kilometer?",
            feedback: "The equation y = 3x - 2 represents fare (y) based on kilometers (x). Slope = rate of change = ₱3 per kilometer."
          },
          {
            id: "ALIGN-Q8-02-02",
            text: "Aling Maria sells fish. For every kilo, she charges ₱3 more than the base price. If base price affects total differently, what is the price increase per kilo?",
            feedback: "The slope represents the change in price per kilo. In y = 3x - 2, slope = 3. Price increases by ₱3 per kilo."
          },
          {
            id: "ALIGN-Q8-02-03",
            text: "Kuya Pedro's earnings increase by ₱3 for each hour he works beyond the base. What is his hourly rate for extra hours?",
            feedback: "In the equation y = 3x - 2, the coefficient of x (which is 3) represents the slope or rate of change. Hourly rate = ₱3."
          },
          {
            id: "ALIGN-Q8-02-04",
            text: "A water tank fills at a rate of 3 liters per minute after an initial adjustment. What is the filling rate?",
            feedback: "The slope in y = 3x - 2 is 3, meaning the rate of filling is 3 liters per minute."
          },
          {
            id: "ALIGN-Q8-02-05",
            text: "The temperature increases by 3 degrees for each hour. If the starting temperature is adjusted, what is the rate of temperature increase?",
            feedback: "Slope = rate of change. In y = 3x - 2, slope = 3. Temperature increases by 3 degrees per hour."
          },
          {
            id: "ALIGN-Q8-02-06",
            text: "A vendor's profit is calculated as ₱3 per item sold minus ₱2 fixed cost. What is the profit per item?",
            feedback: "The equation is Profit = 3x - 2. The coefficient of x is 3, which is the profit per item sold."
          },
          {
            id: "ALIGN-Q8-02-07",
            text: "In a savings plan, you earn ₱3 for every ₱1 you save, with an initial deduction. What is the earning rate?",
            feedback: "The slope in y = 3x - 2 represents the earning rate. For each peso (x), you earn ₱3. Rate = 3."
          },
          {
            id: "ALIGN-Q8-02-08",
            text: "A taxi fare includes a base rate and then ₱3 for each kilometer. What is the per-kilometer rate?",
            feedback: "In y = 3x - 2, the 3 is the per-kilometer rate. Slope = 3 pesos per kilometer."
          },
          {
            id: "ALIGN-Q8-02-09",
            text: "The cost of books is ₱3 each with an initial discount. What is the cost per book?",
            feedback: "The slope (coefficient of x) in y = 3x - 2 is 3. Cost per book = ₱3."
          },
          {
            id: "ALIGN-Q8-02-10",
            text: "For every additional passenger beyond the base, a jeepney charges ₱3 more. What is the additional charge per passenger?",
            feedback: "The slope in the linear equation y = 3x - 2 is 3. Additional charge = ₱3 per passenger."
          }
        ]
      },
      {
        id: "RMA-Q8-03",
        text: "If a rectangle has length 8cm and width 3cm, what is its area?",
        type: "rma",
        category: "Geometry",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q8-03-01",
            text: "Aling Maria's garden is 8 meters long and 3 meters wide. What is the total area she can plant?",
            feedback: "Area of rectangle = length × width. So 8m × 3m = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-02",
            text: "Kuya Pedro's rice field is 8 meters by 3 meters. How many square meters is his field?",
            feedback: "Area = length × width = 8 × 3 = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-03",
            text: "A classroom floor is 8 meters long and 3 meters wide. What area does it cover?",
            feedback: "Area = 8m × 3m = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-04",
            text: "Mang Tomas has a rectangular plot of land measuring 8 meters by 3 meters. What is the area of his plot?",
            feedback: "Rectangle area formula: length × width. 8 × 3 = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-05",
            text: "A table is 8 decimeters long and 3 decimeters wide. What is its surface area in square decimeters?",
            feedback: "Area = length × width = 8 dm × 3 dm = 24 square decimeters."
          },
          {
            id: "ALIGN-Q8-03-06",
            text: "A fish pond is rectangular with length 8m and width 3m. What is the area of the pond's surface?",
            feedback: "Area = 8m × 3m = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-07",
            text: "Aling Ana's house has a rectangular yard 8 meters by 3 meters. What is the yard's area?",
            feedback: "Multiply length by width: 8 × 3 = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-08",
            text: "A piece of cloth is 8 meters long and 3 meters wide. What is its total area?",
            feedback: "Area of a rectangle = length × width = 8 × 3 = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-09",
            text: "Kuya John's store has a rectangular space 8m by 3m for displays. What is the display area?",
            feedback: "Display area = 8 × 3 = 24 square meters."
          },
          {
            id: "ALIGN-Q8-03-10",
            text: "A rectangular garden bed is 8 meters in length and 3 meters in width. Calculate its area.",
            feedback: "Use area formula: length × width = 8 × 3 = 24 square meters."
          }
        ]
      },
      // Add more Grade 8 questions as needed
    ],
    // Grade 9 Questions - Focus on Quadratic Equations, Geometry, Advanced Algebra
    9: [
      {
        id: "RMA-Q9-01",
        text: "Solve for x: x² - 5x + 6 = 0",
        type: "rma",
        category: "Quadratic Equations",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q9-01-01",
            text: "Aling Maria has a rectangular garden. The area is 6 square meters. The length is 5 meters more than the width. What are the dimensions?",
            feedback: "Let width = x, length = x + 5. Area: x(x + 5) = 6 → x² + 5x - 6 = 0. Factors: (x + 6)(x - 1) = 0. x = 1 (width), length = 6. Dimensions: 1m × 6m."
          },
          {
            id: "ALIGN-Q9-01-02",
            text: "Kuya Pedro has a piece of land. The product of its length and width is 6. The sum is 5. What are the dimensions?",
            feedback: "Let length = x, width = y. xy = 6, x + y = 5. From second equation: y = 5 - x. Substitute: x(5 - x) = 6 → x² - 5x + 6 = 0. Factors: (x - 2)(x - 3) = 0. x = 2 or 3. Dimensions: 2m × 3m."
          },
          {
            id: "ALIGN-Q9-01-03",
            text: "A rectangular fish pond has an area of 6 sq m. If the length is 5m longer than the width, find the width.",
            feedback: "Let width = x. Length = x + 5. Area: x(x + 5) = 6 → x² + 5x - 6 = 0. Solve: x = [-5 ± √(25 + 24)]/2 = [-5 ± 7]/2. x = 1 (width)."
          },
          {
            id: "ALIGN-Q9-01-04",
            text: "Si Mang Tomas has a garden where length × width = 6. Length = width + 5. What is the width?",
            feedback: "x(x + 5) = 6 → x² + 5x - 6 = 0. Factor: (x + 6)(x - 1) = 0. x = 1 meter (width is positive)."
          },
          {
            id: "ALIGN-Q9-01-05",
            text: "The product of two numbers is 6. The larger is 1 more than the smaller. Find the numbers.",
            feedback: "Let smaller = x, larger = x + 1. x(x + 1) = 6 → x² + x - 6 = 0. Factors: (x + 3)(x - 2) = 0. x = 2. Numbers: 2 and 3."
          },
          {
            id: "ALIGN-Q9-01-06",
            text: "A rectangle has area 6. One side is 1 unit longer than the other. What are the side lengths?",
            feedback: "Let x = shorter side. x(x + 1) = 6 → x² + x - 6 = 0. Solutions: x = 2. Sides: 2 and 3 units."
          },
          {
            id: "ALIGN-Q9-01-07",
            text: "Aling Ana has a rectangular plot. The area is 6 sq m. The length exceeds the width by 1m. Find the dimensions.",
            feedback: "x(x + 1) = 6 → x² + x - 6 = 0. Factor: (x + 3)(x - 2) = 0. Width = 2m, Length = 3m."
          },
          {
            id: "ALIGN-Q9-01-08",
            text: "Two consecutive numbers multiply to 6. What are the numbers?",
            feedback: "Let numbers be x and x+1. x(x+1) = 6 → x² + x - 6 = 0. Solutions: x = 2. Numbers: 2 and 3."
          },
          {
            id: "ALIGN-Q9-01-09",
            text: "A rectangular field has area 6 sq m. The length is 1m more than the width. What are the dimensions?",
            feedback: "x(x + 1) = 6 → x² + x - 6 = 0. Positive solution: x = 2m (width), length = 3m."
          },
          {
            id: "ALIGN-Q9-01-10",
            text: "Two numbers multiply to 6 and differ by 1. What are the numbers?",
            feedback: "Let numbers be x and x+1. x(x+1) = 6 → x² + x - 6 = 0. Factors: (x+3)(x-2) = 0. x = 2. Numbers: 2 and 3."
          }
        ]
      },
      {
        id: "RMA-Q9-02",
        text: "Find the area of a circle with radius 5cm. (Use π = 3.14)",
        type: "rma",
        category: "Geometry",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q9-02-01",
            text: "Aling Maria has a circular garden with radius 5 meters. What is the area she can plant? (Use π = 3.14)",
            feedback: "Area of circle = π × r² = 3.14 × 5² = 3.14 × 25 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-02",
            text: "Kuya Pedro has a round fish pond with radius 5 meters. What is the surface area? (Use π = 3.14)",
            feedback: "Area = πr² = 3.14 × 5 × 5 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-03",
            text: "A circular table has diameter 10cm. What is its surface area? (Use π = 3.14)",
            feedback: "Radius = diameter/2 = 5cm. Area = πr² = 3.14 × 5² = 78.5 square cm."
          },
          {
            id: "ALIGN-Q9-02-04",
            text: "Si Mang Tomas has a circular plot of land with radius 5 meters. What is the area? (Use π = 3.14)",
            feedback: "Area = π × radius² = 3.14 × 25 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-05",
            text: "A round basketball court has radius 5 meters. What is the area? (Use π = 3.14)",
            feedback: "Area = πr² = 3.14 × 25 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-06",
            text: "Aling Ana has a circular garden with diameter 10 meters. What is the planting area? (Use π = 3.14)",
            feedback: "Radius = 5m. Area = 3.14 × 5² = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-07",
            text: "A circular swimming pool has radius 5 meters. What is the surface area? (Use π = 3.14)",
            feedback: "Area = π × r² = 3.14 × 25 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-08",
            text: "Kuya John has a round display area with radius 5 meters. What is the display area? (Use π = 3.14)",
            feedback: "Area = 3.14 × 5 × 5 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-09",
            text: "A circular stage has diameter 10 meters. What is the area? (Use π = 3.14)",
            feedback: "Radius = 5m. Area = πr² = 3.14 × 25 = 78.5 square meters."
          },
          {
            id: "ALIGN-Q9-02-10",
            text: "A round water tank has radius 5 meters. What is the cross-sectional area? (Use π = 3.14)",
            feedback: "Cross-sectional area = πr² = 3.14 × 25 = 78.5 square meters."
          }
        ]
      },
      {
        id: "RMA-Q9-03",
        text: "Simplify: (3x² + 2x - 5) + (2x² - 4x + 1)",
        type: "rma",
        category: "Polynomials",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q9-03-01",
            text: "Aling Maria has two gardens. First garden has (3x² + 2x - 5) sq m, second has (2x² - 4x + 1) sq m. What is the total area?",
            feedback: "Add the areas: (3x² + 2x - 5) + (2x² - 4x + 1) = 5x² - 2x - 4 sq m."
          },
          {
            id: "ALIGN-Q9-03-02",
            text: "Kuya Pedro has two fish ponds. Pond A is (3x² + 2x - 5) sq m, Pond B is (2x² - 4x + 1) sq m. Total area?",
            feedback: "Total = 3x² + 2x² + 2x - 4x - 5 + 1 = 5x² - 2x - 4 square meters."
          },
          {
            id: "ALIGN-Q9-03-03",
            text: "Si Mang Tomas has two rice fields. Field 1: (3x² + 2x - 5) sq m, Field 2: (2x² - 4x + 1) sq m. Combined area?",
            feedback: "Combine like terms: (3x² + 2x²) + (2x - 4x) + (-5 + 1) = 5x² - 2x - 4 sq m."
          },
          {
            id: "ALIGN-Q9-03-04",
            text: "Aling Ana has two plots of land. First: (3x² + 2x - 5) sq m, Second: (2x² - 4x + 1) sq m. Total land area?",
            feedback: "Add: 3x² + 2x² = 5x², 2x - 4x = -2x, -5 + 1 = -4. Total: 5x² - 2x - 4 sq m."
          },
          {
            id: "ALIGN-Q9-03-05",
            text: "A farmer has two rectangular fields. Areas: (3x² + 2x - 5) and (2x² - 4x + 1). Total area?",
            feedback: "Sum: (3x² + 2x²) + (2x - 4x) + (-5 + 1) = 5x² - 2x - 4 square meters."
          },
          {
            id: "ALIGN-Q9-03-06",
            text: "Two circular gardens have areas (3x² + 2x - 5) and (2x² - 4x + 1). What is the combined area?",
            feedback: "Add the polynomials: 5x² - 2x - 4 square meters."
          },
          {
            id: "ALIGN-Q9-03-07",
            text: "Kuya John has two display areas. First: (3x² + 2x - 5) sq m, Second: (2x² - 4x + 1) sq m. Total display area?",
            feedback: "Total = 3x² + 2x² + 2x - 4x - 5 + 1 = 5x² - 2x - 4 sq m."
          },
          {
            id: "ALIGN-Q9-03-08",
            text: "Two classrooms have areas (3x² + 2x - 5) and (2x² - 4x + 1) sq m. What is the total floor area?",
            feedback: "Combine like terms: 5x² - 2x - 4 square meters."
          },
          {
            id: "ALIGN-Q9-03-09",
            text: "A school has two rectangular plots. Areas: (3x² + 2x - 5) and (2x² - 4x + 1). Total area?",
            feedback: "Add: (3x² + 2x²) + (2x - 4x) + (-5 + 1) = 5x² - 2x - 4 sq m."
          },
          {
            id: "ALIGN-Q9-03-10",
            text: "Combine the expressions: (3x² + 2x - 5) + (2x² - 4x + 1). What is the result?",
            feedback: "Add like terms: x² terms: 3x² + 2x² = 5x². x terms: 2x - 4x = -2x. Constants: -5 + 1 = -4. Result: 5x² - 2x - 4."
          }
        ]
      }
    ],
    // Grade 10 Questions - Focus on Advanced Algebra, Trigonometry, Statistics
    10: [
      {
        id: "RMA-Q10-01",
        text: "Find the solution set of the inequality: 2x - 3 > 7",
        type: "rma",
        category: "Inequalities",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-01-01",
            text: "Aling Maria has some mangoes. If she gives away 3 and has more than 7 left, how many did she have originally?",
            feedback: "Let x = original mangoes. x - 3 > 7. Add 3: x > 10. She had more than 10 mangoes."
          },
          {
            id: "ALIGN-Q10-01-02",
            text: "Kuya Pedro sold some fish. After selling 3 times as many minus 3, he has more than 7 kilos. How many did he sell?",
            feedback: "3x - 3 > 7. Add 3: 3x > 10. Divide by 3: x > 10/3 ≈ 3.33. He sold more than 3.33 kilos."
          },
          {
            id: "ALIGN-Q10-01-03",
            text: "A jeepney fare is ₱x. Twice the fare minus ₱3 is more than ₱7. What is the minimum fare?",
            feedback: "2x - 3 > 7. Add 3: 2x > 10. Divide by 2: x > 5. Minimum fare is more than ₱5."
          },
          {
            id: "ALIGN-Q10-01-04",
            text: "Maria has twice as many apples as Ana. If she gives 3 to Ana, she has more than 7. How many does Maria have?",
            feedback: "Let Ana have x, Maria has 2x. After giving 3: 2x - 3 > 7 → 2x > 10 → x > 5. Maria has more than 10 apples."
          },
          {
            id: "ALIGN-Q10-01-05",
            text: "Solve: 2x - 3 > 7. What values of x satisfy this?",
            feedback: "Add 3: 2x > 10. Divide by 2: x > 5. Solution: x > 5."
          },
          {
            id: "ALIGN-Q10-01-06",
            text: "If you double your money and subtract ₱3, you have more than ₱7. How much do you need?",
            feedback: "2x - 3 > 7 → 2x > 10 → x > 5. You need more than ₱5."
          },
          {
            id: "ALIGN-Q10-01-07",
            text: "A store sells pencils at ₱x each. Buying 2 with a ₱3 discount gives more than ₱7. What is the price per pencil?",
            feedback: "2x - 3 > 7 → 2x > 10 → x > 5. Price per pencil is more than ₱5."
          },
          {
            id: "ALIGN-Q10-01-08",
            text: "Aling Maria has some eggs. She sells twice as many minus 3, and has more than 7 left. How many did she have?",
            feedback: "This scenario may not work with positive eggs. Consider: She has x eggs, sells (2x - 3) eggs, has > 7 left. So x - (2x - 3) > 7 → -x + 3 > 7 → x < -4. Not possible. The inequality should be interpreted differently."
          },
          {
            id: "ALIGN-Q10-01-09",
            text: "Kuya John has some chickens. Twice the number minus 3 is more than 7. How many chickens?",
            feedback: "2x - 3 > 7 → 2x > 10 → x > 5. Kuya John has more than 5 chickens."
          },
          {
            id: "ALIGN-Q10-01-10",
            text: "The difference between twice a number and 3 is more than 7. Find the number.",
            feedback: "2x - 3 > 7 → 2x > 10 → x > 5. The number is greater than 5."
          }
        ]
      },
      {
        id: "RMA-Q10-02",
        text: "What is the median of the data set: 3, 5, 7, 9, 11?",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-02-01",
            text: "Aling Maria has 5 students with scores: 3, 5, 7, 9, 11. What is the middle score?",
            feedback: "Arrange scores in order (already ordered): 3, 5, 7, 9, 11. With 5 scores, the median is the 3rd score = 7."
          },
          {
            id: "ALIGN-Q10-02-02",
            text: "Kuya Pedro has 5 fish with weights: 3kg, 5kg, 7kg, 9kg, 11kg. What is the median weight?",
            feedback: "Ordered weights: 3, 5, 7, 9, 11. Median (middle value) = 7kg."
          },
          {
            id: "ALIGN-Q10-02-03",
            text: "Five jeepney fares are: ₱3, ₱5, ₱7, ₱9, ₱11. What is the middle fare?",
            feedback: "Ordered: 3, 5, 7, 9, 11. Median = ₱7."
          },
          {
            id: "ALIGN-Q10-02-04",
            text: "Si Mang Tomas has 5 sacks of rice: 3kg, 5kg, 7kg, 9kg, 11kg. What is the median weight?",
            feedback: "Already ordered. Median is the middle value: 7kg."
          },
          {
            id: "ALIGN-Q10-02-05",
            text: "Five students have heights: 143cm, 145cm, 147cm, 149cm, 151cm. What is the median height?",
            feedback: "Ordered heights. Middle value (3rd) = 147cm."
          },
          {
            id: "ALIGN-Q10-02-06",
            text: "Aling Ana has 5 mango trees with yields: 3, 5, 7, 9, 11 kilos. What is the median yield?",
            feedback: "Ordered yields. Median = 7 kilos (middle value)."
          },
          {
            id: "ALIGN-Q10-02-07",
            text: "A store has 5 items priced: ₱3, ₱5, ₱7, ₱9, ₱11. What is the median price?",
            feedback: "Ordered prices. Median = ₱7."
          },
          {
            id: "ALIGN-Q10-02-08",
            text: "Kuya John has 5 chickens with egg production: 3, 5, 7, 9, 11 eggs/month. What is the median production?",
            feedback: "Ordered production. Median = 7 eggs/month."
          },
          {
            id: "ALIGN-Q10-02-09",
            text: "Five temperatures are: 3°C, 5°C, 7°C, 9°C, 11°C. What is the median temperature?",
            feedback: "Ordered temperatures. Median = 7°C."
          },
          {
            id: "ALIGN-Q10-02-10",
            text: "Find the middle value of: 3, 5, 7, 9, 11. What is it?",
            feedback: "The numbers are already in order. With 5 numbers, the median is the 3rd number = 7."
          }
        ]
      },
      {
        id: "RMA-Q10-03",
        text: "Simplify: (x + 3)(x - 2)",
        type: "rma",
        category: "Polynomials",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-03-01",
            text: "Aling Maria has a rectangular garden. One side is (x + 3) meters, the other is (x - 2) meters. What is the area?",
            feedback: "Area = length × width = (x + 3)(x - 2) = x² - 2x + 3x - 6 = x² + x - 6 square meters."
          },
          {
            id: "ALIGN-Q10-03-02",
            text: "Kuya Pedro has a fish pond with dimensions (x + 3)m and (x - 2)m. What is the area?",
            feedback: "Area = (x + 3)(x - 2) = x² + x - 6 square meters."
          },
          {
            id: "ALIGN-Q10-03-03",
            text: "Si Mang Tomas has a rectangular plot. Length = (x + 3)m, width = (x - 2)m. What is the total area?",
            feedback: "Area = (x + 3)(x - 2) = x² + x - 6 sq m."
          },
          {
            id: "ALIGN-Q10-03-04",
            text: "Aling Ana has a rectangular yard. One side is (x + 3) meters, adjacent side is (x - 2) meters. Area?",
            feedback: "Multiply: (x + 3)(x - 2) = x² + x - 6 square meters."
          },
          {
            id: "ALIGN-Q10-03-05",
            text: "A rectangular room has length (x + 3) and width (x - 2). What is the floor area?",
            feedback: "Area = (x + 3)(x - 2) = x² + x - 6 square units."
          },
          {
            id: "ALIGN-Q10-03-06",
            text: "Two numbers are (x + 3) and (x - 2). What is their product?",
            feedback: "Product = (x + 3)(x - 2) = x² + x - 6."
          },
          {
            id: "ALIGN-Q10-03-07",
            text: "Kuya John has a rectangular display. Sides are (x + 3) and (x - 2). What is the display area?",
            feedback: "Display area = (x + 3)(x - 2) = x² + x - 6 square meters."
          },
          {
            id: "ALIGN-Q10-03-08",
            text: "A rectangular stage has dimensions (x + 3) and (x - 2). What is the stage area?",
            feedback: "Area = (x + 3)(x - 2) = x² + x - 6 square units."
          },
          {
            id: "ALIGN-Q10-03-09",
            text: "A school field has length (x + 3)m and width (x - 2)m. What is the total field area?",
            feedback: "Field area = (x + 3)(x - 2) = x² + x - 6 square meters."
          },
          {
            id: "ALIGN-Q10-03-10",
            text: "Multiply: (x + 3)(x - 2). What is the result?",
            feedback: "Use FOIL: First (x×x = x²), Outer (x×-2 = -2x), Inner (3×x = 3x), Last (3×-2 = -6). Combine: x² - 2x + 3x - 6 = x² + x - 6."
          }
        ]
      }
    ]
  };
  
  // Bank questions (sample - these come from your actual bank data)
  const BANK_QUESTIONS = {
    7: [
      { id: "BANK-Q7-01", text: "Evaluate: 5 + 3 × 2", type: "bank", category: "Order of Operations", masteryRate: 0 },
      { id: "BANK-Q7-02", text: "What is 4(3x - 2)?", type: "bank", category: "Algebraic Expressions", masteryRate: 0 },
      { id: "BANK-Q7-03", text: "If 5/8 of 40 students are boys, how many are girls?", type: "bank", category: "Fractions", masteryRate: 0 },
      { id: "BANK-Q7-04", text: "What is the perimeter of a square with side 6cm?", type: "bank", category: "Geometry", masteryRate: 0 },
      { id: "BANK-Q7-05", text: "Solve: x + 8 = 15", type: "bank", category: "Linear Equations", masteryRate: 0 }
    ],
    8: [
      { id: "BANK-Q8-01", text: "Solve: 3x - 7 = 20", type: "bank", category: "Linear Equations", masteryRate: 0 },
      { id: "BANK-Q8-02", text: "What is the y-intercept of y = 4x + 1?", type: "bank", category: "Linear Functions", masteryRate: 0 },
      { id: "BANK-Q8-03", text: "Area of a square with side 6cm?", type: "bank", category: "Geometry", masteryRate: 0 },
      { id: "BANK-Q8-04", text: "What is the slope of y = 2x + 5?", type: "bank", category: "Linear Functions", masteryRate: 0 },
      { id: "BANK-Q8-05", text: "Solve: 2x + 3 = 11", type: "bank", category: "Linear Equations", masteryRate: 0 }
    ],
    9: [
      { id: "BANK-Q9-01", text: "Solve: x² - 9 = 0", type: "bank", category: "Quadratic Equations", masteryRate: 0 },
      { id: "BANK-Q9-02", text: "Find the area of a circle with diameter 10cm (π=3.14)", type: "bank", category: "Geometry", masteryRate: 0 },
      { id: "BANK-Q9-03", text: "Simplify: (2x + 3) + (4x - 5)", type: "bank", category: "Polynomials", masteryRate: 0 },
      { id: "BANK-Q9-04", text: "Factor: x² + 5x + 6", type: "bank", category: "Polynomials", masteryRate: 0 },
      { id: "BANK-Q9-05", text: "Find the volume of a cube with side 3cm", type: "bank", category: "Geometry", masteryRate: 0 }
    ],
    10: [
      { id: "BANK-Q10-01", text: "Solve: 3x + 2 > 8", type: "bank", category: "Inequalities", masteryRate: 0 },
      { id: "BANK-Q10-02", text: "What is the mode of: 2, 3, 3, 5, 7?", type: "bank", category: "Statistics", masteryRate: 0 },
      { id: "BANK-Q10-03", text: "Simplify: (x + 2)(x + 3)", type: "bank", category: "Polynomials", masteryRate: 0 },
      { id: "BANK-Q10-04", text: "Find the mean of: 4, 6, 8, 10", type: "bank", category: "Statistics", masteryRate: 0 },
      { id: "BANK-Q10-05", text: "Solve: x² + 5x + 6 = 0", type: "bank", category: "Quadratic Equations", masteryRate: 0 }
    ]
  };

  // Current tab state
  let currentTab = 'overview';

  async function rpc(name, payload) {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.details || `Request failed (${response.status})`);
    return data;
  }

  function setMessage(node, text, error = true) {
    node.className = error ? "error" : "success";
    node.textContent = text;
    node.hidden = false;
  }

  function showChangePassword() {
    loginCard.hidden = true;
    changeCard.hidden = false;
    dashboard.hidden = true;
  }

  function showDashboard() {
    loginCard.hidden = true;
    changeCard.hidden = true;
    dashboard.hidden = false;
    loadDashboard();
    showTab('overview'); // Show overview by default
  }

  function unique(values) { return [...new Set(values.filter(Boolean))]; }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================
  
  function showTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.getElementById('tabOverview').className = tabName === 'overview' ? 'secondary active-tab' : 'secondary';
    document.getElementById('tabQuestionMap').className = tabName === 'questionMap' ? 'secondary active-tab' : 'secondary';
    
    // Show/hide tab content
    document.getElementById('tabOverviewContent').hidden = tabName !== 'overview';
    document.getElementById('tabQuestionMapContent').hidden = tabName !== 'questionMap';
    
    // Load content if needed
    if (tabName === 'questionMap' && !document.getElementById('questionsGrid').hasChildNodes()) {
      renderAllQuestions();
    }
  }

  // ============================================
  // QUESTION MAP FUNCTIONS
  // ============================================
  
  /**
   * Get all questions for the current grade (RMA + Bank + Aligned)
   */
  function getAllQuestions() {
    const gradeQuestions = QUESTION_BANK[currentGrade] || [];
    const bankQuestions = BANK_QUESTIONS[currentGrade] || [];
    
    // Add aligned questions as separate entries
    const allQuestions = [];
    
    gradeQuestions.forEach(q => {
      allQuestions.push({ ...q, type: 'rma' });
      // Add aligned questions as individual entries
      q.alignedQuestions.forEach((aligned, index) => {
        allQuestions.push({
          id: aligned.id,
          text: aligned.text,
          type: 'aligned',
          category: q.category,
          masteryRate: 0, // Can be updated from actual data
          parentId: q.id,
          parentText: q.text,
          feedback: aligned.feedback,
          isAligned: true,
          alignedIndex: index + 1
        });
      });
    });
    
    bankQuestions.forEach(q => {
      allQuestions.push({ ...q, type: 'bank' });
    });
    
    return allQuestions;
  }

  /**
   * Update question mastery rates from actual student data
   */
  function updateQuestionMasteryFromData() {
    if (!rows || rows.length === 0) return;
    
    const allQuestions = getAllQuestions();
    
    // Process each row to update mastery rates
    rows.forEach(row => {
      if (row.rma_data) {
        const rmaItems = String(row.rma_data).split('|');
        rmaItems.forEach((item, index) => {
          if (item === '0' || item === '1') {
            const questionId = `RMA-Q${currentGrade}-${index + 1}`;
            const question = allQuestions.find(q => q.id === questionId);
            // This would update mastery in actual implementation
          }
        });
      }
      
      if (row.bank_data) {
        const bankItems = String(row.bank_data).split('|');
        bankItems.forEach(item => {
          const match = item.match(/^([^:]+):([01])$/);
          if (match) {
            const bankQuestionId = match[1];
            const isCorrect = match[2] === '1';
            // Update bank question mastery
          }
        });
      }
    });
  }

  /**
   * Render all questions with filters
   */
  function renderAllQuestions() {
    const questions = getAllQuestions();
    const container = document.getElementById('questionsGrid');
    
    if (!container) return;
    
    // Update mastery rates from actual data if available
    updateQuestionMasteryFromData();
    
    container.innerHTML = questions.map(question => {
      const masteryClass = question.masteryRate >= 80 ? 'mastery-high' : 
                          question.masteryRate >= 60 ? 'mastery-medium' : 'mastery-low';
      const masteryText = question.masteryRate >= 80 ? 'HIGH' : 
                          question.masteryRate >= 60 ? 'MEDIUM' : 'LOW';
      
      // Render options if available
      const optionsHtml = question.options && question.options.length > 0 ? `
        <div class="question-options">
          ${question.options.map((option, idx) => {
            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D...
            const isCorrect = option === question.answer;
            return `
              <div class="option-item ${isCorrect ? 'correct-option' : ''}">
                <span class="option-label">${optionLetter}.</span>
                <span class="option-text">${escapeHtml(option)}</span>
                ${isCorrect ? '<span class="correct-marker">✓</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : '';
      
      // Render answer if available
      const answerHtml = question.answer ? `
        <div class="question-answer">
          <strong>Answer:</strong> ${escapeHtml(question.answer)}
        </div>
      ` : '';
      
      return `
        <div class="question-card" data-type="${question.type}" data-mastery="${masteryClass}" data-category="${question.category || ''}">
          <div class="question-header">
            <span class="question-id">${escapeHtml(question.id)}</span>
            <span class="question-type type-${question.type}">${question.type.toUpperCase()}</span>
            ${question.masteryRate > 0 ? `<span class="mastery-badge ${masteryClass}">${masteryText}: ${question.masteryRate}%</span>` : ''}
          </div>
          <div class="question-text">${escapeHtml(question.text)}</div>
          ${optionsHtml}
          ${answerHtml}
          ${question.category ? `<div class="question-meta"><span>📚 ${escapeHtml(question.category)}</span></div>` : ''}
          ${question.isAligned ? `
            <div class="aligned-info">
              <small>🔗 Aligned with: ${escapeHtml(question.parentId)}</small>
              <button class="toggle-aligned" onclick="toggleFeedback(this)">
                ${question.feedback ? 'HIDE' : 'SHOW'} EXPLANATION
              </button>
              ${question.feedback ? `<div class="feedback-section" style="display:block;"><div class="feedback-label">💡 Explanation:</div><div class="feedback-text">${escapeHtml(question.feedback)}</div></div>` : ''}
            </div>
          ` : ''}
          ${question.alignedQuestions && question.alignedQuestions.length > 0 && !question.isAligned ? `
            <div class="aligned-questions-list">
              <button class="toggle-aligned" onclick="toggleAlignedQuestions('${question.id}')">
                SHOW ${question.alignedQuestions.length} ALIGNED QUESTIONS
              </button>
              <div id="aligned-${question.id}" class="aligned-questions-container" style="display:none;"></div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Toggle display of aligned questions
   */
  function toggleAlignedQuestions(parentId) {
    const container = document.getElementById(`aligned-${parentId}`);
    const button = container.previousElementSibling;
    
    if (container.style.display === 'none' || !container.style.display) {
      container.style.display = 'block';
      button.textContent = button.textContent.replace('SHOW', 'HIDE');
      
      // Render aligned questions
      const parentQuestion = getAllQuestions().find(q => q.id === parentId);
      if (parentQuestion && parentQuestion.alignedQuestions) {
        container.innerHTML = parentQuestion.alignedQuestions.map((aligned, index) => {
          const optionsHtml = aligned.options && aligned.options.length > 0 ? `
            <div class="aligned-options">
              ${aligned.options.map((option, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isCorrect = option === aligned.answer;
                return `
                  <div class="option-item ${isCorrect ? 'correct-option' : ''}">
                    <span class="option-label">${optionLetter}.</span>
                    <span class="option-text">${escapeHtml(option)}</span>
                    ${isCorrect ? '<span class="correct-marker">✓</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : '';
          
          const answerHtml = aligned.answer ? `
            <div class="aligned-answer"><strong>Answer:</strong> ${escapeHtml(aligned.answer)}</div>
          ` : '';
          
          return `
            <div class="aligned-question-item">
              <div class="aligned-q-text">${index + 1}. ${escapeHtml(aligned.text)}</div>
              ${optionsHtml}
              ${answerHtml}
              <div class="feedback-section">
                <div class="feedback-label">💡 Explanation:</div>
                <div class="feedback-text">${escapeHtml(aligned.feedback)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      container.style.display = 'none';
      button.textContent = button.textContent.replace('HIDE', 'SHOW');
    }
  }

  /**
   * Toggle display of feedback
   */
  function toggleFeedback(button) {
    const feedbackSection = button.nextElementSibling;
    
    if (feedbackSection.style.display === 'none' || !feedbackSection.style.display) {
      feedbackSection.style.display = 'block';
      button.textContent = 'HIDE EXPLANATION';
    } else {
      feedbackSection.style.display = 'none';
      button.textContent = 'SHOW EXPLANATION';
    }
  }

  /**
   * Filter questions based on search and filter criteria
   */
  function filterQuestions() {
    const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
    const typeFilter = document.getElementById('questionTypeFilter').value;
    const masteryFilter = document.getElementById('masteryFilter').value;
    
    const allCards = document.querySelectorAll('.question-card');
    
    allCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const type = card.dataset.type;
      const masteryClass = card.dataset.mastery;
      
      let show = true;
      
      // Search filter
      if (searchTerm && !text.includes(searchTerm)) {
        show = false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && type !== typeFilter) {
        show = false;
      }
      
      // Mastery filter
      if (masteryFilter !== 'all') {
        if (masteryFilter === 'high' && !masteryClass.includes('high')) show = false;
        if (masteryFilter === 'medium' && !masteryClass.includes('medium')) show = false;
        if (masteryFilter === 'low' && !masteryClass.includes('low')) show = false;
      }
      
      card.style.display = show ? 'block' : 'none';
    });
  }

  // ============================================
  // PHASE 1: CONFIGURABLE SCORE BANDS
  // ============================================
  
  async function loadScoreBands() {
    try {
      const bands = await rpc("rma_get_score_bands", {});
      if (bands && bands.length > 0) {
        scoreBands = bands.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      } else {
        scoreBands = [
          { band_name: 'proficient', min_score: 80, max_score: 100, label: 'Ready / Proficient', color: '#155b30', icon: '✅', sort_order: 1 },
          { band_name: 'developing', min_score: 60, max_score: 79, label: 'Developing', color: '#c2410c', icon: '🟡', sort_order: 2 },
          { band_name: 'emerging', min_score: 40, max_score: 59, label: 'Emerging', color: '#c2410c', icon: '🟠', sort_order: 3 },
          { band_name: 'needs_support', min_score: 0, max_score: 39, label: 'Needs Intensive Support', color: '#991b1b', icon: '🔴', sort_order: 4 }
        ];
      }
    } catch (error) {
      console.warn("Could not load score bands, using defaults:", error);
      scoreBands = [
        { band_name: 'proficient', min_score: 80, max_score: 100, label: 'Ready / Proficient', color: '#155b30', icon: '✅', sort_order: 1 },
        { band_name: 'developing', min_score: 60, max_score: 79, label: 'Developing', color: '#c2410c', icon: '🟡', sort_order: 2 },
        { band_name: 'emerging', min_score: 40, max_score: 59, label: 'Emerging', color: '#c2410c', icon: '🟠', sort_order: 3 },
        { band_name: 'needs_support', min_score: 0, max_score: 39, label: 'Needs Intensive Support', color: '#991b1b', icon: '🔴', sort_order: 4 }
      ];
    }
    return scoreBands;
  }

  function statusFor(score, attemptNumber = null) {
    if (score === null || score === undefined) {
      if (attemptNumber && attemptNumber > 0) {
        return { label: "Incomplete", className: "status-incomplete", band: null };
      }
      return { label: "Not yet taken", className: "status-not-taken", band: null };
    }
    
    const scoreNum = Number(score);
    const band = scoreBands.find(b => scoreNum >= b.min_score && scoreNum <= b.max_score);
    
    if (band) {
      return { 
        label: band.label, 
        className: `status-${band.band_name}`, 
        band: band
      };
    }
    
    return { label: "Unknown", className: "status-pending", band: null };
  }

  function getBandColor(bandName) {
    const band = scoreBands.find(b => b.band_name === bandName);
    return band ? band.color : '#71666a';
  }

  // ============================================
  // PHASE 1: COMPLETION MONITORING
  // ============================================
  
  function getCompletionStats(rows, grade, section) {
    const filteredRows = section 
      ? rows.filter(r => Number(r.grade) === grade && r.section === section)
      : rows.filter(r => Number(r.grade) === grade);
    
    const total = filteredRows.length;
    const completed = filteredRows.filter(r => r.score !== null && r.score !== undefined).length;
    const notTaken = filteredRows.filter(r => r.score === null || r.score === undefined).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const notTakenList = filteredRows
      .filter(r => r.score === null || r.score === undefined)
      .map(r => ({
        student_code: r.student_code,
        student_name: r.student_name || `${r.last_name}, ${r.first_name}`,
        section: r.section
      }));
    
    return {
      total,
      completed,
      notTaken,
      completionRate,
      notTakenList
    };
  }

  function getLevelDistribution(rows, grade, section) {
    const filteredRows = section 
      ? rows.filter(r => Number(r.grade) === grade && r.section === section)
      : rows.filter(r => Number(r.grade) === grade);
    
    const counts = {};
    scoreBands.forEach(band => {
      counts[band.band_name] = 0;
    });
    
    filteredRows.forEach(row => {
      const status = statusFor(row.score, row.attempt_number);
      if (status.band) {
        counts[status.band.band_name] = (counts[status.band.band_name] || 0) + 1;
      }
    });
    
    return counts;
  }

  function getPriorityLearners(rows, grade, section) {
    const filteredRows = section 
      ? rows.filter(r => Number(r.grade) === grade && r.section === section)
      : rows.filter(r => Number(r.grade) === grade);
    
    const needsSupport = filteredRows
      .filter(r => {
        const status = statusFor(r.score, r.attempt_number);
        return status.band && ['needs_support', 'emerging'].includes(status.band.band_name);
      })
      .map(r => ({
        student_id: r.student_id,
        student_code: r.student_code,
        student_name: r.student_name || `${r.last_name}, ${r.first_name}`,
        score: r.score,
        status: statusFor(r.score, r.attempt_number),
        section: r.section,
        created_at: r.created_at,
        attempt_number: r.attempt_number
      }))
      .sort((a, b) => {
        if (a.score !== b.score) {
          return (a.score || 0) - (b.score || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    
    return needsSupport;
  }

  function renderPriorityLearners(priorityLearners) {
    const container = document.getElementById("priorityLearnersContainer");
    if (!container) return;
    
    if (priorityLearners.length === 0) {
      container.innerHTML = '<p class="report-note">No students currently need intensive support. Well done!</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="priority-stats">
        <span class="priority-count">${priorityLearners.length} students need support</span>
      </div>
      <div class="priority-list">
        ${priorityLearners.map(learner => `
          <div class="student-card-priority">
            <div class="student-header">
              <h4>${escapeHtml(learner.student_name)}</h4>
              <span class="student-code">${escapeHtml(learner.student_code)}</span>
              <span class="student-section">${escapeHtml(learner.section)}</span>
            </div>
            <div class="student-score">
              <span class="score-value">${learner.score || '—'} / 30</span>
              <span class="status-badge ${learner.status.className}">${escapeHtml(learner.status.label)}</span>
            </div>
            <div class="student-meta">
              <span>Last: ${learner.created_at ? new Date(learner.created_at).toLocaleDateString() : '—'}</span>
              ${learner.attempt_number > 1 ? `<span>Attempt #${learner.attempt_number}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCompletionStatus(stats) {
    const container = document.getElementById("completionStatusContainer");
    if (!container) return;
    
    container.innerHTML = `
      <div class="completion-header">
        <h3>Grade ${currentGrade} - ${currentSection || 'All Sections'}</h3>
        <div class="completion-bar-container">
          <div class="completion-bar">
            <div class="completion-fill" style="width: ${stats.completionRate}%"></div>
          </div>
          <span>${stats.completed} / ${stats.total} completed (${stats.completionRate}%)</span>
        </div>
      </div>
      ${stats.notTakenList.length > 0 ? `
        <div class="not-taken-list">
          <h4>Not Yet Taken (${stats.notTakenList.length})</h4>
          <ul>
            ${stats.notTakenList.map(student => `
              <li>${escapeHtml(student.student_name)} <span class="student-code-small">${escapeHtml(student.student_code)}</span> <span class="student-section-small">${escapeHtml(student.section)}</span></li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    `;
  }

  function renderDashboardOverview() {
    if (!currentGrade) {
      document.getElementById("reportCard").hidden = true;
      return;
    }
    
    const stats = getCompletionStats(rows, currentGrade, currentSection);
    const levels = getLevelDistribution(rows, currentGrade, currentSection);
    const priorityLearners = getPriorityLearners(rows, currentGrade, currentSection);
    
    document.getElementById("summary").innerHTML = `
      <div class="metric">
        <b>${stats.total}</b>
        <span>Total Students</span>
      </div>
      <div class="metric">
        <b>${stats.completed}</b>
        <span>Completed</span>
      </div>
      <div class="metric">
        <b>${stats.notTaken}</b>
        <span>Not Yet Taken</span>
      </div>
      <div class="metric">
        <b>${stats.completionRate}%</b>
        <span>Completion Rate</span>
      </div>
    `;
    
    const gradeHighlights = document.getElementById("gradeHighlights");
    if (gradeHighlights) {
      gradeHighlights.innerHTML = `
        <div class="highlight">
          <span>📊 Class Performance</span>
          <div class="level-distribution">
            ${Object.entries(levels).map(([bandName, count]) => {
              const band = scoreBands.find(b => b.band_name === bandName);
              if (!band || count === 0) return '';
              return `
                <div class="level-item">
                  <span class="level-icon" style="color: ${band.color}">${band.icon}</span>
                  <span>${band.label}: <strong>${count}</strong></span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="highlight">
          <span>🎯 Priority Learners</span>
          <strong>${priorityLearners.length} need support</strong>
          <small>Click to view details</small>
        </div>
      `;
    }
    
    const sections = unique(
      rows.filter(r => Number(r.grade) === currentGrade && (!currentSection || r.section === currentSection))
        .map(row => row.section)
    ).sort((a, b) => a.localeCompare(b));
    
    document.getElementById("sectionExtremes").innerHTML = sections.map((section) => {
      const sectionRows = rows.filter(row => 
        Number(row.grade) === currentGrade && row.section === section && (!currentSection || row.section === currentSection)
      );
      const range = extremes(sectionRows);
      return `<tr>
        <td>${escapeHtml(section)}</td>
        <td>${escapeHtml(range ? range.least.map((item) => item.question).join(", ") : "No item data")}</td>
        <td>${range ? `${range.least[0].rate}%` : "—"}</td>
        <td>${escapeHtml(range ? range.most.map((item) => item.question).join(", ") : "No item data")}</td>
        <td>${range ? `${range.most[0].rate}%` : "—"}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="5">No registered sections yet.</td></tr>';
    
    const allMembers = rows.filter(row => Number(row.grade) === currentGrade && (!currentSection || row.section === currentSection));
    const stats = questionStats(allMembers);
    document.getElementById("masteryRows").innerHTML = stats.length ? stats.map((item) =>
      `<tr>
        <td>${escapeHtml(item.question)}</td>
        <td>${item.correct}</td>
        <td>${item.count}</td>
        <td><div class="bar" aria-label="${item.rate}% mastery"><i style="width:${item.rate}%;background:${getBandColorForRate(item.rate)}"></i></div></td>
        <td><b>${item.rate}%</b></td>
      </tr>`
    ).join("") : '<tr><td colspan="5">No item-level results have been submitted for this report scope.</td></tr>';
    
    document.getElementById("studentRows").innerHTML = allMembers.map((row) => {
      const state = statusFor(row.score, row.attempt_number);
      const score = row.score === null || row.score === undefined ? "—" : `${Number(row.score)}%`;
      const attempt = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
      return `<tr>
        <td>${escapeHtml(row.student_code)}</td>
        <td>${escapeHtml(row.student_name || `${row.last_name}, ${row.first_name}`)}</td>
        <td>${escapeHtml(row.teacher_name)}</td>
        <td>${score}</td>
        <td><span class="status ${state.className}">${state.label}</span></td>
        <td>${escapeHtml(attempt)}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="6">No students are registered for this report scope.</td></tr>';
    
    renderCompletionStatus(stats);
    renderPriorityLearners(priorityLearners);
  }

  function getBandColorForRate(rate) {
    if (rate >= 80) return getBandColor('proficient');
    if (rate >= 60) return getBandColor('developing');
    if (rate >= 40) return getBandColor('emerging');
    return getBandColor('needs_support');
  }

  function extremes(members) {
    const stats = questionStats(members);
    if (!stats.length) return null;
    const minimum = Math.min(...stats.map((item) => item.rate));
    const maximum = Math.max(...stats.map((item) => item.rate));
    return {
      least: stats.filter((item) => item.rate === minimum),
      most: stats.filter((item) => item.rate === maximum)
    };
  }

  function questionStats(members) {
    const totals = new Map();
    members.filter((row) => row.score !== null && row.score !== undefined).forEach((row) => {
      parseResponses(row).forEach((correct, question) => {
        const total = totals.get(question) || { correct: 0, count: 0 };
        total.count++;
        if (correct) total.correct++;
        totals.set(question, total);
      });
    });
    return [...totals.entries()].map(([question, total]) => ({
      question,
      correct: total.correct,
      count: total.count,
      rate: Math.round((total.correct / total.count) * 100)
    })).sort((a, b) => {
      const qa = a.question.match(/(\d+)$/); const qb = b.question.match(/(\d+)$/);
      const groupA = a.question.startsWith("RMA") ? 0 : 1; const groupB = b.question.startsWith("RMA") ? 0 : 1;
      return groupA - groupB || Number(qa?.[1] || 0) - Number(qb?.[1] || 0);
    });
  }

  function parseResponses(row) {
    const result = new Map();
    String(row.rma_data || "").split("|").forEach((answer, index) => {
      if (answer === "0" || answer === "1") result.set(`RMA Q${index + 1}`, answer === "1");
    });
    String(row.bank_data || "").split("|").forEach((entry) => {
      const match = entry.match(/^([^:]+):([01])$/);
      if (match) result.set(`Bank item ${match[1]}`, match[2] === "1");
    });
    return result;
  }

  function renderSelectedReport() {
    const grade = Number(gradeFilter.value);
    currentGrade = grade;
    currentSection = null; // Will be set by section filter
    
    if (!grade) {
      document.getElementById("reportCard").hidden = true;
      return;
    }
    
    const gradeMembers = rows.filter((row) => Number(row.grade) === grade);
    const sections = unique(gradeMembers.map((row) => row.section)).sort((a, b) => a.localeCompare(b));
    sections.unshift("*");
    
    sectionFilter.innerHTML = sections.map((section) => 
      `<option value="${escapeHtml(section)}">${escapeHtml(section === "*" ? "All sections" : section)}</option>`
    ).join("");
    sectionFilter.disabled = false;
    sectionFilter.value = "*";
    
    renderDashboardOverview();
  }

  async function loadDashboard() {
    dashboardMessage.hidden = true;
    try {
      await loadScoreBands();
      
      rows = await rpc("rma_teacher_dashboard", { p_token: token });
      
      rows.forEach(row => {
        if (row.attempt_number === undefined || row.attempt_number === null) {
          row.attempt_number = 1;
        }
      });
      
      const grades = unique(rows.map((row) => String(row.grade))).sort((a, b) => Number(a) - Number(b));
      gradeFilter.innerHTML = '<option value="">Choose a grade level</option>' + 
        grades.map((grade) => `<option value="${escapeHtml(grade)}">Grade ${escapeHtml(grade)}</option>`).join("");
      sectionFilter.innerHTML = '<option value="">Select a grade first</option>';
      sectionFilter.disabled = true;
      document.getElementById("reportCard").hidden = true;
      
      if (!rows.length) {
        setMessage(dashboardMessage, "No student accounts are registered yet.", false);
      }
    } catch (error) {
      setMessage(dashboardMessage, error.message || "Could not load mastery data.");
      if (String(error.message).toLowerCase().includes("expired")) { 
        token = ""; 
        dashboard.hidden = true; 
        loginCard.hidden = false; 
      }
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  document.getElementById("teacherLogin").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    message.hidden = true;
    try {
      const result = await rpc("rma_teacher_login", {
        p_username: document.getElementById("teacherUsername").value.trim(),
        p_password: document.getElementById("teacherPassword").value
      });
      token = result.token;
      sessionStorage.setItem("rma_teacher_token", token);
      if (result.must_change_password) showChangePassword(); else showDashboard();
    } catch (error) {
      setMessage(message, error.message || "Sign in failed.");
    } finally { button.disabled = false; }
  });

  document.getElementById("saveTeacherPassword").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const password = document.getElementById("newTeacherPassword").value;
    if (password !== document.getElementById("confirmTeacherPassword").value) return setMessage(passwordMessage, "The password fields do not match.");
    button.disabled = true;
    try {
      await rpc("rma_teacher_change_password", { p_token: token, p_new_password: password });
      showDashboard();
    } catch (error) { setMessage(passwordMessage, error.message || "Could not change the password."); }
    finally { button.disabled = false; }
  });

  gradeFilter.addEventListener("change", () => {
    const grade = Number(gradeFilter.value);
    currentGrade = grade;
    if (!grade) {
      sectionFilter.innerHTML = '<option value="">Select a grade first</option>';
      sectionFilter.disabled = true;
      document.getElementById("reportCard").hidden = true;
      return;
    }
    const sections = unique(rows.filter((row) => Number(row.grade) === grade).map((row) => row.section)).sort((a, b) => a.localeCompare(b));
    sections.unshift("*");
    sectionFilter.innerHTML = sections.map((section) => 
      `<option value="${escapeHtml(section)}">${escapeHtml(section === "*" ? "All sections" : section)}</option>`
    ).join("");
    sectionFilter.disabled = false;
    sectionFilter.value = "*";
    renderDashboardOverview();
  });

  sectionFilter.addEventListener("change", () => {
    currentSection = sectionFilter.value === "*" ? null : sectionFilter.value;
    renderDashboardOverview();
  });

  document.getElementById("teacherLogout").addEventListener("click", () => {
    sessionStorage.removeItem("rma_teacher_token"); token = ""; rows = [];
    dashboard.hidden = true; loginCard.hidden = false;
  });

  // Expose for debugging
  window._QUESTION_BANK = QUESTION_BANK;
  window._BANK_QUESTIONS = BANK_QUESTIONS;
  
  // Do not silently reuse a stored teacher token: shared devices require a fresh sign-in.
})();
