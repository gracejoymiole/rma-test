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
  let questionMastery = new Map();

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
      // ============================================
      // GRADE 10 QUESTIONS - ALL 47 RMA QUESTIONS
      // Note: First 5 questions fully implemented with options/answers in aligned questions
      // Remaining questions to be added following the same pattern
      // ============================================
      {
        id: "RMA-Q10-01",
        text: "[Refer to Box 1] Your classmate said that each of the four expressions in Box 1 is equivalent to 1. Verify what your classmate said by computing the value for the number expression 4×4 - 5×3.",
        options: ["0", "1", "2", "-1"],
        answer: "1",
        type: "rma",
        category: "Algebraic Patterns",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-01-01",
            text: "Si Aling Maria ay may 4 basket na may 4 mansanas bawat isa. Bumili siya ng 5 basket na may 3 mansanas bawat isa. Ilang mansanas ang natira?",
            options: ["0", "1", "2", "-1"],
            answer: "1",
            feedback: "Gumamit ng order of operations: (4×4) - (5×3) = 16 - 15 = 1 mansanas natira."
          },
          {
            id: "ALIGN-Q10-01-02",
            text: "Kuya Pedro ay may 4 box na may 4 itlog bawat box. Binenta niya ang 5 box na may 3 itlog bawat isa. Ilang itlog ang natitira?",
            options: ["0 itlog", "1 itlog", "2 itlog", "-1 itlog"],
            answer: "1 itlog",
            feedback: "Kalkulasyon: (4×4) = 16 itlog, (5×3) = 15 itlog, 16 - 15 = 1 itlog natira."
          },
          {
            id: "ALIGN-Q10-01-03",
            text: "Ang expression ay 5×5 - 6×4. Ano ang sagot?",
            options: ["0", "1", "2", "-1"],
            answer: "1",
            feedback: "5×5 = 25, 6×4 = 24, 25 - 24 = 1. Pattern: n² - (n+1)(n-1) = 1."
          },
          {
            id: "ALIGN-Q10-01-04",
            text: "Ang expression ay 6×6 - 7×5. Ano ang value?",
            options: ["0", "1", "2", "-1"],
            answer: "1",
            feedback: "6×6 = 36, 7×5 = 35, 36 - 35 = 1. Pattern: n² - (n+1)(n-1) = 1."
          },
          {
            id: "ALIGN-Q10-01-05",
            text: "Bakit palaging 1 ang resulta ng mga expression sa Box 1?",
            options: ["Dahil n² - (n+1)(n-1) = 1", "Dahil random lang", "Dahil may error", "Dahil ganoon ang ginawa"],
            answer: "Dahil n² - (n+1)(n-1) = 1",
            feedback: "Algebraic simplification: (n+1)(n-1) = n² - 1, kaya n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-01-06",
            text: "Sa expression (n)(n) - (n+1)(n-1), ano ang ibig sabihin ng (n+1) at (n-1)?",
            options: ["Ang numero pagkatapos at ang numero bago ng n", "Ang numero bago at ang numero pagkatapos ng n", "Random numbers", "Magkaparehong numero"],
            answer: "Ang numero pagkatapos at ang numero bago ng n",
            feedback: "(n+1) ay ang numero pagkatapos ng n, (n-1) ay ang numero bago ng n."
          },
          {
            id: "ALIGN-Q10-01-07",
            text: "Si Mang Tomas ay gumagawa ng pattern: 2×2-3×1, 3×3-4×2, 4×4-5×3. Ano ang susunod?",
            options: ["5×5-6×4", "6×6-7×5", "4×4-3×5", "5×6-6×5"],
            answer: "5×5-6×4",
            feedback: "Ang pattern ay n² - (n+1)(n-1). Para sa n=5: 5×5 - 6×4."
          },
          {
            id: "ALIGN-Q10-01-08",
            text: "Anong algebraic expression ang represent ng pattern sa Box 1?",
            options: ["(n)(n) - (n+3)(n+1)", "(n)(n) - (n+1)(n-1)", "(n-1)(n-1) - n(n-2)", "n² - n - 1"],
            answer: "(n)(n) - (n+1)(n-1)",
            feedback: "Ang pattern ay n² - (n+1)(n-1) = n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-01-09",
            text: "Sa expression (n)(n) - (n+1)(n-1), ano ang ibig sabihin ng n?",
            options: ["Ang huling sagot", "Ang unang numero", "Ang bilang ng mga terms", "Random variable"],
            answer: "Ang unang numero",
            feedback: "Ang n ay ang unang numero sa bawat expression na isinquare."
          },
          {
            id: "ALIGN-Q10-01-10",
            text: "Ang expression 7×7 - 8×6 ay bahagi ba ng pattern sa Box 1?",
            options: ["Oo, bahagi ng pattern", "Hindi, di bahagi ng pattern", "Oo, ngunit may error", "Hindi, random lang"],
            answer: "Oo, bahagi ng pattern",
            feedback: "Para sa n=7: 7×7 - 8×6 = 49 - 48 = 1. Bahagi ng pattern."
          }
        ]
      },
      {
        id: "RMA-Q10-02",
        text: "[Refer to Box 1] What must be the next number expression to 5×5 - 6×4 in Box 1?",
        options: ["6×6 - 7×5", "6×5 - 7×4", "7×7 - 8×6", "5×6 - 6×7"],
        answer: "6×6 - 7×5",
        type: "rma",
        category: "Algebraic Patterns",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-02-01",
            text: "Ang pattern sa Box 1 ay 2×2-3×1, 3×3-4×2, 4×4-5×3, 5×5-6×4. Anong susunod na expression?",
            options: ["6×6-7×5", "6×5-7×4", "7×7-8×6", "5×6-6×7"],
            answer: "6×6-7×5",
            feedback: "Ang pattern ay n×n - (n+1)(n-1). Para sa n=6: 6×6 - 7×5."
          },
          {
            id: "ALIGN-Q10-02-02",
            text: "Si Aling Rosa ay may pattern: 2²-3×1, 3²-4×2, 4²-5×3. Anong expression ang susunod?",
            options: ["5²-6×4", "6²-7×5", "7²-8×6", "4²-5×3"],
            answer: "5²-6×4",
            feedback: "Ang pattern ay sumusunod sa n=2,3,4,5. Kaya susunod ay n=5: 5² - 6×4."
          },
          {
            id: "ALIGN-Q10-02-03",
            text: "Kuya Pedro ay gumagawa ng pattern sa Box 1. Ang ikalawang expression ay 3×3-4×2. Anong ikatlo?",
            options: ["4×4-5×3", "5×5-6×4", "3×3-2×4", "4×4-3×5"],
            answer: "4×4-5×3",
            feedback: "Ang pattern ay n×n - (n+1)(n-1) para sa n=2,3,4,... Kaya ikatlo ay n=4: 4×4 - 5×3."
          },
          {
            id: "ALIGN-Q10-02-04",
            text: "Ang pattern ay n² - (n+1)(n-1). Anong expression para sa n=8?",
            options: ["8×8-9×7", "7×7-8×6", "9×9-10×8", "8×8-7×9"],
            answer: "8×8-9×7",
            feedback: "Substitute n=8: 8×8 - (8+1)(8-1) = 8×8 - 9×7."
          },
          {
            id: "ALIGN-Q10-02-05",
            text: "Ang expression 5×5 - 6×4 ay ______ sa pattern?",
            options: ["Ikaapat", "Ikalima", "Ikaanim", "Ikapito"],
            answer: "Ikaapat",
            feedback: "n=2 (1st), n=3 (2nd), n=4 (3rd), n=5 (4th). Kaya ikaapat."
          },
          {
            id: "ALIGN-Q10-02-06",
            text: "Bakit ang susunod na expression ay 6×6 - 7×5?",
            options: ["Dahil sumusunod sa pattern n×n - (n+1)(n-1)", "Dahil random lang", "Dahil ganoon ang sabi", "Dahil mas madaling intindihin"],
            answer: "Dahil sumusunod sa pattern n×n - (n+1)(n-1)",
            feedback: "Ang pattern ay consistent: n=2,3,4,5,6. Kaya 6×6 - 7×5."
          },
          {
            id: "ALIGN-Q10-02-07",
            text: "Anong algebraic pattern ang ginagamit sa Box 1?",
            options: ["n² - (n+1)(n-1)", "n² - n - 1", "(n+1)² - (n-1)²", "n(n-1) - (n+1)(n+2)"],
            answer: "n² - (n+1)(n-1)",
            feedback: "Ito ang pattern na ginagamit: n×n - (n+1)(n-1) = n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-02-08",
            text: "Ang expression 7×7 - 8×6 ay ______ ng pattern",
            options: ["Simula", "Gitna", "Dulo", "Bahagi"],
            answer: "Bahagi",
            feedback: "Ang expression na 7×7 - 8×6 ay bahagi ng pattern n² - (n+1)(n-1) para sa n=7."
          },
          {
            id: "ALIGN-Q10-02-09",
            text: "Anong susunod sa pattern pagkatapos ng 5×5 - 6×4?",
            options: ["6×6 - 7×5", "6×5 - 7×4", "7×7 - 8×6", "5×6 - 4×7"],
            answer: "6×6 - 7×5",
            feedback: "Ang pattern ay n×n - (n+1)(n-1). Para sa n=6: 6×6 - 7×5."
          },
          {
            id: "ALIGN-Q10-02-10",
            text: "Ang pattern sa Box 1 ay tinatawag na anong uri ng pattern?",
            options: ["Arithmetic sequence", "Geometric sequence", "Algebraic pattern", "Random numbers"],
            answer: "Algebraic pattern",
            feedback: "Ito ay algebraic pattern dahil gumagamit ng algebraic expressions."
          }
        ]
      },
      {
        id: "RMA-Q10-03",
        text: "[Refer to Box 1] [Refer to eq1] Which of the following algebraic expressions represents the set of number expressions in Box 1?",
        options: ["(n)(n) - (n+3)(n+1)", "(n)(n) - (n+1)(n-1)", "(n-1)(n-1) - n(n-2)", "n² - 3n(1)", "n² - n - 1"],
        answer: "(n)(n) - (n+1)(n-1)",
        type: "rma",
        category: "Algebraic Patterns",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-03-01",
            text: "Anong algebraic expression ang represent ng set ng number expressions sa Box 1?",
            options: ["(n)(n) - (n+3)(n+1)", "(n)(n) - (n+1)(n-1)", "(n-1)(n-1) - n(n-2)", "n² - 3n"],
            answer: "(n)(n) - (n+1)(n-1)",
            feedback: "Ang bawat expression ay gumagamit ng pattern: n×n - (n+1)(n-1)."
          },
          {
            id: "ALIGN-Q10-03-02",
            text: "Si Aling Maria ay may mga expression: 2×2-3×1, 3×3-4×2, 4×4-5×3. Anong algebraic expression ang represent nito?",
            options: ["n² - (n+1)(n-1)", "(n+1)² - n²", "n(n-1) - (n+1)(n+2)", "2n - 1"],
            answer: "n² - (n+1)(n-1)",
            feedback: "Ang pattern ay n×n - (n+1)(n-1) = n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-03-03",
            text: "Kuya Pedro ay gumagawa ng algebraic expression para sa pattern sa Box 1. Anong tamang expression?",
            options: ["n(n) - (n+1)(n-1)", "(n+1)(n-1) - n(n)", "n² + (n+1)(n-1)", "n(n+1) - (n-1)"],
            answer: "n(n) - (n+1)(n-1)",
            feedback: "Ang pattern sa Box 1 ay n×n - (n+1)(n-1)."
          },
          {
            id: "ALIGN-Q10-03-04",
            text: "Ang expression n² - (n² - 1) ay katumbas ng anong expression sa Box 1?",
            options: ["(n)(n) - (n+3)(n+1)", "(n)(n) - (n+1)(n-1)", "(n-1)(n-1) - n(n-2)", "n² - n - 1"],
            answer: "(n)(n) - (n+1)(n-1)",
            feedback: "Ang (n)(n) - (n+1)(n-1) = n² - (n² - 1) = n² - n² + 1 = 1."
          },
          {
            id: "ALIGN-Q10-03-05",
            text: "Anong algebraic expression ang nagpapaliwanag sa pattern ng Box 1?",
            options: ["n² - (n+1)(n-1)", "n² + (n+1)(n-1)", "(n+1)² - (n-1)²", "2n + 1"],
            answer: "n² - (n+1)(n-1)",
            feedback: "Ito ang expression na nagpapaliwanag: n×n - (n+1)(n-1)."
          },
          {
            id: "ALIGN-Q10-03-06",
            text: "Si Mang Tomas ay may mga expression: 4×4-5×3, 5×5-6×4. Anong algebraic expression ang represent nito?",
            options: ["n(n) - (n+1)(n-1)", "(n+1)(n-1) - n(n)", "n² - 2n", "2n - 1"],
            answer: "n(n) - (n+1)(n-1)",
            feedback: "Ang pattern ay n×n - (n+1)(n-1)."
          },
          {
            id: "ALIGN-Q10-03-07",
            text: "Ang expression (n)(n) - (n+1)(n-1) ay ______ ng Box 1?",
            options: ["Bahagi", "Buo", "Kalahati", "Hindi kaugnay"],
            answer: "Buo",
            feedback: "Ang expression na (n)(n) - (n+1)(n-1) ay ang algebraic representation ng BUONG set ng expressions sa Box 1."
          },
          {
            id: "ALIGN-Q10-03-08",
            text: "Anong expression ang nag-EEQUAL sa 1 para sa anumang n?",
            options: ["n² - (n+1)(n-1)", "n² - n", "n² + n", "2n - 1"],
            answer: "n² - (n+1)(n-1)",
            feedback: "n² - (n+1)(n-1) = n² - (n² - 1) = 1 para sa anumang n."
          },
          {
            id: "ALIGN-Q10-03-09",
            text: "Ang expression sa Box 1 ay gumagamit ng anong mathematical concept?",
            options: ["Order of operations", "Distributive property", "Commutative property", "Associative property"],
            answer: "Distributive property",
            feedback: "Ang (n+1)(n-1) = n² - 1 gumagamit ng distributive property."
          },
          {
            id: "ALIGN-Q10-03-10",
            text: "Anong expression ang nagpapakita ng pattern sa Box 1?",
            options: ["(n)(n) - (n+1)(n-1)", "(n+1)(n-1) - n(n)", "n(n+1) - (n-1)(n+2)", "n² - 1"],
            answer: "(n)(n) - (n+1)(n-1)",
            feedback: "Ito ang expression na nagpapakita ng pattern: n×n - (n+1)(n-1)."
          }
        ]
      },
      {
        id: "RMA-Q10-04",
        text: "[Refer to Box 1] [Refer to addimg 1] Which of the following best explains why your chosen expression correctly represents the set of number expressions in Box 1?",
        options: [
          "The first term is always the square of a number n (n²), subtracts by the product of the number after it (n+1) and the number before it (n-1).",
          "The first term is a number n multiplied by 2, minus the product of n and n-1.",
          "The terms are increasing multiples of 2 and 3.",
          "The difference between consecutive expressions is always 1."
        ],
        answer: "The first term is always the square of a number n (n²), subtracts by the product of the number after it (n+1) and the number before it (n-1).",
        type: "rma",
        category: "Algebraic Patterns",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-04-01",
            text: "Bakit ang expression (n)(n) - (n+1)(n-1) ang tamang representasyon ng Box 1?",
            options: [
              "Dahil ang unang term ay laging n², binawasan ng product ng (n+1) at (n-1)",
              "Dahil ang unang term ay 2n, binawasan ng n(n-1)",
              "Dahil ang terms ay increasing multiples",
              "Dahil ang difference ay laging 1"
            ],
            answer: "Dahil ang unang term ay laging n², binawasan ng product ng (n+1) at (n-1)",
            feedback: "Ang pattern ay n² - (n+1)(n-1) = n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-04-02",
            text: "Ang expression sa Box 1 ay gumagamit ng n². Ano ang ibig sabihin nito?",
            options: ["Ang square ng unang numero", "Ang product ng dalawang numero", "Ang sum ng dalawang numero", "Ang difference ng dalawang numero"],
            answer: "Ang square ng unang numero",
            feedback: "Ang (n)(n) ay n², ang square ng unang numero."
          },
          {
            id: "ALIGN-Q10-04-03",
            text: "Bakit tamang pagpili ang (n)(n) - (n+1)(n-1)?",
            options: ["Dahil nagbibigay ng tamang structure ng pattern", "Dahil random lang", "Dahil ganoon ang sinabi", "Dahil mas madaling intindihin"],
            answer: "Dahil nagbibigay ng tamang structure ng pattern",
            feedback: "Ang expression na (n)(n) - (n+1)(n-1) ay naglalarawan ng structure: unang term ay n², binawasan ng product ng (n+1) at (n-1)."
          },
          {
            id: "ALIGN-Q10-04-04",
            text: "Ang expression ay n² - (n+1)(n-1). Ano ang ibig sabihin ng (n+1) at (n-1)?",
            options: ["Ang numero pagkatapos at ang numero bago ng n", "Ang numero bago at ang numero pagkatapos ng n", "Ang dalawang random na numero", "Ang dalawang magkaparehong numero"],
            answer: "Ang numero pagkatapos at ang numero bago ng n",
            feedback: "(n+1) ay ang numero pagkatapos ng n, (n-1) ay ang numero bago ng n."
          },
          {
            id: "ALIGN-Q10-04-05",
            text: "Bakit ang expression (n)(n) - (n+1)(n-1) ay tamang representasyon?",
            options: ["Dahil naglalarawan ng pattern ng Box 1", "Dahil naglalarawan ng iba't ibang pattern", "Dahil random ang pagpili", "Dahil mas madaling pumili"],
            answer: "Dahil naglalarawan ng pattern ng Box 1",
            feedback: "Ang expression ay naglalarawan ng pattern: n² - (n+1)(n-1) = n² - (n² - 1) = 1."
          },
          {
            id: "ALIGN-Q10-04-06",
            text: "Anong mathematical operation ang ginagamit sa pattern?",
            options: ["Multiplication at Subtraction", "Addition at Subtraction", "Multiplication at Addition", "Division at Subtraction"],
            answer: "Multiplication at Subtraction",
            feedback: "Ang pattern ay gumagamit ng multiplication (n×n) at subtraction (-(n+1)(n-1))."
          },
          {
            id: "ALIGN-Q10-04-07",
            text: "Ang expression (n)(n) - (n+1)(n-1) ay ______ ng Box 1?",
            options: ["Tamang representasyon", "Maling representasyon", "Kalahati lamang ng representasyon", "Hindi kaugnay"],
            answer: "Tamang representasyon",
            feedback: "Ang expression na (n)(n) - (n+1)(n-1) ay tamang representasyon ng pattern sa Box 1."
          },
          {
            id: "ALIGN-Q10-04-08",
            text: "Bakit ang (n+1)(n-1) ay tinatawag na product ng numero pagkatapos at bago?",
            options: ["Dahil (n+1) at (n-1) ay magkaparehong layo kay n", "Dahil random lang", "Dahil ganoon ang tawag", "Dahil mas madaling intindihin"],
            answer: "Dahil (n+1) at (n-1) ay magkaparehong layo kay n",
            feedback: "Ang (n+1) ay ang numero pagkatapos ng n (1 unit away), (n-1) ay ang numero bago ng n (1 unit away)."
          },
          {
            id: "ALIGN-Q10-04-09",
            text: "Ang expression ay n² - (n² - 1). Ano ang simplified form nito?",
            options: ["0", "1", "n", "2n"],
            answer: "1",
            feedback: "n² - (n² - 1) = n² - n² + 1 = 1."
          },
          {
            id: "ALIGN-Q10-04-10",
            text: "Bakit ang pattern ay laging nagreresulta sa 1?",
            options: ["Dahil n² - (n² - 1) = 1", "Dahil random ang resulta", "Dahil may error", "Dahil ganoon ang ginawa"],
            answer: "Dahil n² - (n² - 1) = 1",
            feedback: "Ang algebraic simplification ay nagpapakita na n² - (n² - 1) = n² - n² + 1 = 1 para sa anumang n."
          }
        ]
      },
      {
        id: "RMA-Q10-05",
        text: "[Refer to Box 1] [Refer to addimg 1] What does n represent in your chosen expression?",
        options: ["The final answer of the expression", "The first number in the expression", "The number of terms in the expression", "A random variable"],
        answer: "The first number in the expression",
        type: "rma",
        category: "Algebraic Patterns",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-05-01",
            text: "Sa expression (n)(n) - (n+1)(n-1), ano ang ibig sabihin ng n?",
            options: ["Ang huling sagot", "Ang unang numero", "Ang bilang ng mga terms", "Isang random na variable"],
            answer: "Ang unang numero",
            feedback: "Sa expression (n)(n) - (n+1)(n-1), ang 'n' ay ang unang numero na isinquare."
          },
          {
            id: "ALIGN-Q10-05-02",
            text: "Si Aling Maria ay may expression: 2×2-3×1, 3×3-4×2. Ang n ay represent ng anong numero?",
            options: ["Ang ikalawang numero", "Ang unang numero", "Ang huling numero", "Ang bilang ng mga expression"],
            answer: "Ang unang numero",
            feedback: "Sa pattern, ang n ay ang unang numero sa bawat expression. Para sa 2×2-3×1, n=2."
          },
          {
            id: "ALIGN-Q10-05-03",
            text: "Ang expression ay (n)(n) - (n+1)(n-1). Ang n ay ______ sa expression",
            options: ["Ang variable na represent ang unang numero", "Ang variable na represent ang huling numero", "Ang variable na represent ang lahat ng numero", "Isang constant"],
            answer: "Ang variable na represent ang unang numero",
            feedback: "Ang n ay ang variable na represent ang unang numero sa bawat expression sa Box 1."
          },
          {
            id: "ALIGN-Q10-05-04",
            text: "Para sa expression 5×5-6×4, ano ang value ng n?",
            options: ["2", "3", "4", "5"],
            answer: "5",
            feedback: "Ang expression ay n×n - (n+1)(n-1). Para sa 5×5-6×4, n=5."
          },
          {
            id: "ALIGN-Q10-05-05",
            text: "Ang n sa expression (n)(n) - (n+1)(n-1) ay ______",
            options: ["Ang unang numero na isinquare", "Ang ikalawang numero", "Ang resultang numero", "Isang random na numero"],
            answer: "Ang unang numero na isinquare",
            feedback: "Ang (n)(n) ay n², kaya ang n ay ang unang numero na isinquare."
          },
          {
            id: "ALIGN-Q10-05-06",
            text: "Si Kuya Pedro ay gumagamit ng expression (n)(n) - (n+1)(n-1). Ang n=4, ano ang expression?",
            options: ["4×4-5×3", "3×3-4×2", "5×5-6×4", "4×4-3×5"],
            answer: "4×4-5×3",
            feedback: "Para sa n=4, ang expression ay 4×4 - (4+1)(4-1) = 4×4 - 5×3."
          },
          {
            id: "ALIGN-Q10-05-07",
            text: "Ang n ay represent ng anong bahagi ng expression?",
            options: ["Ang base ng pattern", "Ang exponent ng pattern", "Ang result ng pattern", "Ang error ng pattern"],
            answer: "Ang base ng pattern",
            feedback: "Ang n ay ang base ng pattern na ginagamit upang bumuo ng expression."
          },
          {
            id: "ALIGN-Q10-05-08",
            text: "Sa pattern na 2×2-3×1, 3×3-4×2, ang n ay ______",
            options: ["Ang unang numero sa bawat expression", "Ang ikalawang numero sa bawat expression", "Ang resultang numero", "Isang random na numero"],
            answer: "Ang unang numero sa bawat expression",
            feedback: "Ang n ay ang unang numero sa bawat expression: 2 para sa 2×2-3×1, 3 para sa 3×3-4×2."
          },
          {
            id: "ALIGN-Q10-05-09",
            text: "Ang n sa expression (n)(n) - (n+1)(n-1) ay ______ sa pattern",
            options: ["Ang variable na nagbabago", "Ang variable na permanent", "Ang resultang value", "Isang constant"],
            answer: "Ang variable na nagbabago",
            feedback: "Ang n ay nagbabago para sa bawat expression: n=2,3,4,5,..."
          },
          {
            id: "ALIGN-Q10-05-10",
            text: "Bakit importante na maintindihan kung ano ang n?",
            options: ["Dahil nagbibigay ng structure ang n sa pattern", "Dahil random lang", "Dahil ganoon ang sinabi", "Dahil mas madaling intindihin"],
            answer: "Dahil nagbibigay ng structure ang n sa pattern",
            feedback: "Ang n ay ang base variable na nagbibigay ng structure sa pattern at nagpapaliwanag kung bakit laging 1 ang resulta."
          }
        ]
      },
      // Question 6: Power of 2 Verification
      {
        id: "RMA-Q10-06",
        text: "Which of the following shows that 1024 is a power of 2?",
        options: [
          "It is divisible by 2.",
          "It can be written as 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2.",
          "It is a multiple of 4.",
          "It ends in an even number."
        ],
        answer: "It can be written as 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2.",
        type: "rma",
        category: "Exponents",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-06-01",
            text: "Si Aling Maria ay may 1024 na mansanas. Paano niya mapapaliwanag na ito ay power of 2?",
            options: [
              "Dahil divisible ito sa 2",
              "Dahil pwedeng isulat bilang 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2",
              "Dahil multiple ito ng 4",
              "Dahil nagtatapos sa even number"
            ],
            answer: "Dahil pwedeng isulat bilang 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2",
            feedback: "Ang power of 2 ay nangangahulugan na ang numero ay pwedeng i-express bilang 2 na i-multiply sa sarili nang ilang beses. 2^10 = 1024."
          },
          {
            id: "ALIGN-Q10-06-02",
            text: "Kuya Pedro ay may 1024 na itlog. Anong katibayan na ito ay power of 2?",
            options: [
              "Dahil 1024 ÷ 2 = 512 (divisible by 2)",
              "Dahil 2^10 = 1024",
              "Dahil 1024 ÷ 4 = 256 (multiple of 4)",
              "Dahil nagtatapos sa 4 (even)"
            ],
            answer: "Dahil 2^10 = 1024",
            feedback: "Ang pinakamahusay na katibayan ay ang expression: 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 1024."
          },
          {
            id: "ALIGN-Q10-06-03",
            text: "Ang bilang 1024 ay ______ ng 2?",
            options: ["Multiple", "Power", "Factor", "Root"],
            answer: "Power",
            feedback: "Ang 1024 = 2^10, kaya ito ay power of 2."
          },
          {
            id: "ALIGN-Q10-06-04",
            text: "Bakit ang 1024 ay power of 2 at hindi multiple lang?",
            options: [
              "Dahil pwedeng isulat sa form ng 2^n",
              "Dahil divisible sa 2",
              "Dahil even number",
              "Dahil malaki"
            ],
            answer: "Dahil pwedeng isulat sa form ng 2^n",
            feedback: "Ang power of 2 ay nangangahulugan na pwedeng i-express bilang 2^n. Ang 1024 = 2^10."
          },
          {
            id: "ALIGN-Q10-06-05",
            text: "Anong exponent ang ginagamit para makuha ang 1024?",
            options: ["8", "9", "10", "12"],
            answer: "10",
            feedback: "2^10 = 1024. Kaya exponent ay 10."
          },
          {
            id: "ALIGN-Q10-06-06",
            text: "Si Mang Tomas ay may 1024 na p era. Ilang beses niya i-multiply ang 2 sa sarili?",
            options: ["8 beses", "9 beses", "10 beses", "12 beses"],
            answer: "10 beses",
            feedback: "2 × 2 × ... × 2 (10 beses) = 2^10 = 1024."
          },
          {
            id: "ALIGN-Q10-06-07",
            text: "Ang 2^10 ay katumbas ng anong bilang?",
            options: ["512", "1024", "2048", "4096"],
            answer: "1024",
            feedback: "2^10 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 1024."
          },
          {
            id: "ALIGN-Q10-06-08",
            text: "Anong katibayan na ang 1024 ay power of 2?",
            options: [
              "Divisible by 2",
              "Can be written as 2 multiplied by itself 10 times",
              "Multiple of 4",
              "Ends with even digit"
            ],
            answer: "Can be written as 2 multiplied by itself 10 times",
            feedback: "Ang power of 2 ay nangangahulugan na ang bilang ay pwedeng i-express bilang 2 na i-multiply sa sarili nang ilang beses."
          },
          {
            id: "ALIGN-Q10-06-09",
            text: "Ang 1024 ay ______ ng 2?",
            options: ["10th power", "12th power", "8th power", "9th power"],
            answer: "10th power",
            feedback: "2^10 = 1024, kaya 10th power of 2."
          },
          {
            id: "ALIGN-Q10-06-10",
            text: "Paano mo masasabi na ang 1024 ay power of 2?",
            options: [
              "Dahil 1024 ÷ 2 = 512",
              "Dahil 2^10 = 1024",
              "Dahil 1024 ÷ 4 = 256",
              "Dahil even ang 1024"
            ],
            answer: "Dahil 2^10 = 1024",
            feedback: "Ang pinakamalinaw na katibayan ay ang expression: 2^10 = 1024."
          }
        ]
      },
      // Question 7: Exponential Form
      {
        id: "RMA-Q10-07",
        text: "What is the exponential form of 1024?",
        options: ["2⁸", "2⁹", "2¹⁰", "2¹²"],
        answer: "2¹⁰",
        type: "rma",
        category: "Exponents",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-07-01",
            text: "Ang exponential form ng 1024 ay ______?",
            options: ["2^8", "2^9", "2^10", "2^12"],
            answer: "2^10",
            feedback: "2^10 = 1024. Ang exponent ay 10."
          },
          {
            id: "ALIGN-Q10-07-02",
            text: "Si Aling Maria ay may 1024 na saging. Anong exponential form nito?",
            options: ["2^8", "2^9", "2^10", "2^12"],
            answer: "2^10",
            feedback: "1024 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 2^10."
          },
          {
            id: "ALIGN-Q10-07-03",
            text: "Kuya Pedro ay gumagawa ng tower ng blocks. Ang bawat level ay double ng previous. Sa 10th level, may 1024 blocks. Anong exponential form?",
            options: ["2^8 blocks", "2^9 blocks", "2^10 blocks", "2^12 blocks"],
            answer: "2^10 blocks",
            feedback: "Ang pattern ay 2^n para sa nth level. Sa 10th level: 2^10 = 1024 blocks."
          },
          {
            id: "ALIGN-Q10-07-04",
            text: "Ang 1024 ay katumbas ng ______?",
            options: ["2 raised to 8", "2 raised to 9", "2 raised to 10", "2 raised to 12"],
            answer: "2 raised to 10",
            feedback: "2^10 = 1024. Kaya 2 raised to the power of 10."
          },
          {
            id: "ALIGN-Q10-07-05",
            text: "Anong exponent ang kailangan para sa 2 upang makuha ang 1024?",
            options: ["8", "9", "10", "12"],
            answer: "10",
            feedback: "2^10 = 1024. Kaya exponent ay 10."
          },
          {
            id: "ALIGN-Q10-07-06",
            text: "Si Mang Tomas ay gumagamit ng calculator. Sinulat niya 2^10. Magkano ang result?",
            options: ["512", "1024", "2048", "4096"],
            answer: "1024",
            feedback: "2^10 = 1024."
          },
          {
            id: "ALIGN-Q10-07-07",
            text: "Ang exponential form ng 1024 ay ______?",
            options: ["2^8", "2^9", "2^10", "10^2"],
            answer: "2^10",
            feedback: "Ang 1024 ay 2 na i-multiply sa sarili 10 beses, kaya 2^10."
          },
          {
            id: "ALIGN-Q10-07-08",
            text: "Ilang 2 ang kailangan para makuha ang 1024?",
            options: ["8", "9", "10", "12"],
            answer: "10",
            feedback: "2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 1024. 10 na beses."
          },
          {
            id: "ALIGN-Q10-07-09",
            text: "Ang 2^10 ay ______?",
            options: ["512", "1024", "2048", "4096"],
            answer: "1024",
            feedback: "2^10 = 1024."
          },
          {
            id: "ALIGN-Q10-07-10",
            text: "Paano isusulat ang 1024 sa exponential form?",
            options: ["2^8", "2^9", "2^10", "2^12"],
            answer: "2^10",
            feedback: "Ang exponential form ay 2^10."
          }
        ]
      },
      // Question 8: Power of 2 Conditions
      {
        id: "RMA-Q10-08",
        text: "Which power of 2 meets BOTH of these conditions: The number is a multiple of 16, and it is more than 50 but less than 200?",
        options: ["32", "64", "128", "Both 64 and 128"],
        answer: "Both 64 and 128",
        type: "rma",
        category: "Exponents",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-08-01",
            text: "Anong power of 2 ang katumbas ng multiple of 16 at nasa pagitan ng 50 at 200?",
            options: ["32", "64", "128", "Parehong 64 at 128"],
            answer: "Parehong 64 at 128",
            feedback: "Ang powers of 2 na nasa pagitan ng 50 at 200 ay 64 (2^6) at 128 (2^7). Parehong divisible sa 16."
          },
          {
            id: "ALIGN-Q10-08-02",
            text: "Si Aling Maria ay may 64 at 128 na mansanas. Alin sa mga ito ang power of 2 na multiple of 16?",
            options: ["64 lang", "128 lang", "Parehong 64 at 128", "Wala"],
            answer: "Parehong 64 at 128",
            feedback: "64 = 2^6 at 128 = 2^7. Parehong divisible sa 16 (16×4=64, 16×8=128)."
          },
          {
            id: "ALIGN-Q10-08-03",
            text: "Kuya Pedro ay nagbebenta ng itlog. May 64 at 128 na itlog siya. Alin ang power of 2 na multiple of 16?",
            options: ["64", "128", "Pareho", "Wala"],
            answer: "Pareho",
            feedback: "Parehong 64 (2^6) at 128 (2^7) ay divisible sa 16."
          },
          {
            id: "ALIGN-Q10-08-04",
            text: "Ang power of 2 na nasa pagitan ng 50 at 200 ay ______?",
            options: ["64 at 128", "32 at 64", "128 at 256", "64 lang"],
            answer: "64 at 128",
            feedback: "2^6 = 64, 2^7 = 128. Parehong nasa pagitan ng 50 at 200."
          },
          {
            id: "ALIGN-Q10-08-05",
            text: "Anong dalawang power of 2 ang multiple of 16 at nasa pagitan ng 50 at 200?",
            options: ["32 at 64", "64 at 128", "128 at 256", "64 at 256"],
            answer: "64 at 128",
            feedback: "64 (2^6) at 128 (2^7) ay parehong divisible sa 16 at nasa pagitan ng 50 at 200."
          },
          {
            id: "ALIGN-Q10-08-06",
            text: "Ang condition ay: multiple of 16 AND more than 50 but less than 200. Alin ang power of 2?",
            options: ["32", "64", "128", "64 at 128"],
            answer: "64 at 128",
            feedback: "Parehong 64 at 128 ay multiple of 16 (64÷16=4, 128÷16=8) at nasa pagitan ng 50 at 200."
          },
          {
            id: "ALIGN-Q10-08-07",
            text: "Si Mang Tomas ay may bilang na power of 2. Ito ay multiple of 16 at nasa pagitan ng 50 at 200. Anong posibleng bilang?",
            options: ["32", "64", "128", "Parehong 64 at 128"],
            answer: "Parehong 64 at 128",
            feedback: "Parehong 64 (2^6) at 128 (2^7) ay nasa pagitan ng 50 at 200 at divisible sa 16."
          },
          {
            id: "ALIGN-Q10-08-08",
            text: "Ang power of 2 na 64 ay ______ ng 16?",
            options: ["Multiple", "Factor", "Not related", "Same"],
            answer: "Multiple",
            feedback: "64 ÷ 16 = 4, kaya 64 ay multiple of 16."
          },
          {
            id: "ALIGN-Q10-08-09",
            text: "Ang 128 ay divisible sa 16. Tama ba?",
            options: ["Oo", "Hindi", "Depende", "Hindi sigurado"],
            answer: "Oo",
            feedback: "128 ÷ 16 = 8, kaya oo, divisible sa 16."
          },
          {
            id: "ALIGN-Q10-08-10",
            text: "Ang dalawang power of 2 na nasa pagitan ng 50 at 200 ay ______?",
            options: ["32 at 64", "64 at 128", "128 at 256", "64 lang"],
            answer: "64 at 128",
            feedback: "2^6 = 64, 2^7 = 128. Parehong nasa pagitan ng 50 at 200."
          }
        ]
      },
      // Question 9: Number Between Decimals
      {
        id: "RMA-Q10-09",
        text: "Is there a number between 0.998 and 0.999?",
        options: ["Yes, for example 0.9985", "Yes, for example 0.9995", "No, they are consecutive decimals", "Yes, for example 0.9975"],
        answer: "Yes, for example 0.9985",
        type: "rma",
        category: "Decimals",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-09-01",
            text: "May numero ba sa pagitan ng 0.998 at 0.999?",
            options: ["Oo, halimbawa 0.9985", "Hindi, consecutive ang decimals", "Oo, halimbawa 0.9995", "Oo, halimbawa 0.9975"],
            answer: "Oo, halimbawa 0.9985",
            feedback: "Ang real numbers ay infinitely dense. Pwede kang magdagdag ng decimal place. Halimbawa: 0.9985."
          },
          {
            id: "ALIGN-Q10-09-02",
            text: "Si Aling Maria ay may 0.998 na kg ng asukal. May nagbili ng 0.999 na kg. May numero ba sa pagitan?",
            options: ["Oo", "Hindi", "Depende", "Hindi sigurado"],
            answer: "Oo",
            feedback: "Pwede kang magdagdag ng decimal place: 0.9985, 0.99825, etc."
          },
          {
            id: "ALIGN-Q10-09-03",
            text: "Ang 0.998 at 0.999 ay ______?",
            options: ["Magkapareho", "Magkapatid", "Mayroong numero sa pagitan", "Walang numero sa pagitan"],
            answer: "Mayroong numero sa pagitan",
            feedback: "Ang decimals ay infinitely dense, kaya mayroong numero sa pagitan ng anumang dalawang decimals."
          },
          {
            id: "ALIGN-Q10-09-04",
            text: "Anong halimbawa ng numero sa pagitan ng 0.998 at 0.999?",
            options: ["0.9985", "0.9995", "0.9975", "0.9980"],
            answer: "0.9985",
            feedback: "Ang 0.9985 ay nasa pagitan ng 0.998 at 0.999."
          },
          {
            id: "ALIGN-Q10-09-05",
            text: "Bakit may numero sa pagitan ng 0.998 at 0.999?",
            options: [
              "Dahil ang decimals ay infinitely dense",
              "Dahil consecutive ang decimals",
              "Dahil random lang",
              "Dahil ganoon ang sinabi"
            ],
            answer: "Dahil ang decimals ay infinitely dense",
            feedback: "Ang real numbers ay infinitely dense, kaya pwedeng magdagdag ng decimal place."
          },
          {
            id: "ALIGN-Q10-09-06",
            text: "Si Kuya Pedro ay may 0.998 na litro ng gatas. Gusto niya ng 0.999. Pwede ba?",
            options: ["Oo, pwede", "Hindi, walang pagitan", "Depende", "Hindi sigurado"],
            answer: "Oo, pwede",
            feedback: "Pwede siyang bumili ng 0.9985 na litro."
          },
          {
            id: "ALIGN-Q10-09-07",
            text: "Ang pagitan ng 0.998 at 0.999 ay ______?",
            options: ["0.001", "0.01", "0.1", "Walang pagitan"],
            answer: "0.001",
            feedback: "Ang difference ay 0.001, pero mayroong numero sa pagitan."
          },
          {
            id: "ALIGN-Q10-09-08",
            text: "Pwede ba magkaroon ng numero sa pagitan ng anumang dalawang decimals?",
            options: ["Oo", "Hindi", "Depende", "Hindi sigurado"],
            answer: "Oo",
            feedback: "Ang decimals ay infinitely dense, kaya pwedeng magkaroon ng numero sa pagitan."
          },
          {
            id: "ALIGN-Q10-09-09",
            text: "Anong numero ang nasa pagitan ng 0.998 at 0.999?",
            options: ["0.9985", "0.9981", "0.9979", "0.9991"],
            answer: "0.9985",
            feedback: "Ang 0.9985 ay nasa pagitan ng 0.998 at 0.999."
          },
          {
            id: "ALIGN-Q10-09-10",
            text: "Ang 0.998 at 0.999 ay ______?",
            options: ["Consecutive decimals", "May pagitan", "Magkapareho", "Random"],
            answer: "May pagitan",
            feedback: "Mayroong numero sa pagitan ng 0.998 at 0.999, tulad ng 0.9985."
          }
        ]
      },
      // Question 10: Decimal Subtraction
      {
        id: "RMA-Q10-10",
        text: "What is the difference when you subtract 0.998 from 0.999?",
        options: ["0.1", "0.01", "0.001", "0.0001"],
        answer: "0.001",
        type: "rma",
        category: "Decimals",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-10-01",
            text: "Ang difference ng 0.999 at 0.998 ay ______?",
            options: ["0.1", "0.01", "0.001", "0.0001"],
            answer: "0.001",
            feedback: "0.999 - 0.998 = 0.001."
          },
          {
            id: "ALIGN-Q10-10-02",
            text: "Si Aling Maria ay may 0.999 na kg ng bigas. Binenta niya ang 0.998 na kg. Ilang kg ang natira?",
            options: ["0.1 kg", "0.01 kg", "0.001 kg", "0.0001 kg"],
            answer: "0.001 kg",
            feedback: "0.999 - 0.998 = 0.001 kg natira."
          },
          {
            id: "ALIGN-Q10-10-03",
            text: "Ang pagbawas: 0.999 - 0.998 = ______?",
            options: ["0.001", "0.01", "0.1", "0.0001"],
            answer: "0.001",
            feedback: "Ang thousandths place: 0.999 - 0.998 = 0.001."
          },
          {
            id: "ALIGN-Q10-10-04",
            text: "Kuya Pedro ay may 0.999 na metro ng tela. Ginupit niya ang 0.998 na metro. Ilang metro ang natira?",
            options: ["0.1 m", "0.01 m", "0.001 m", "0.0001 m"],
            answer: "0.001 m",
            feedback: "0.999m - 0.998m = 0.001m."
          },
          {
            id: "ALIGN-Q10-10-05",
            text: "Ang difference ng 0.999 at 0.998 ay ______?",
            options: ["0.001", "0.01", "0.1", "1"],
            answer: "0.001",
            feedback: "Ang difference sa thousandths place ay 0.001."
          },
          {
            id: "ALIGN-Q10-10-06",
            text: "Si Mang Tomas ay gumagawa ng kalkulasyon: 0.999 - 0.998. Ano ang sagot?",
            options: ["0.001", "0.01", "0.1", "0.0001"],
            answer: "0.001",
            feedback: "Ang result ay 0.001."
          },
          {
            id: "ALIGN-Q10-10-07",
            text: "Anong place value ang ginagamit sa 0.999 - 0.998?",
            options: ["Ones", "Tenths", "Hundredths", "Thousandths"],
            answer: "Thousandths",
            feedback: "Ang 0.999 at 0.998 ay may difference sa thousandths place."
          },
          {
            id: "ALIGN-Q10-10-08",
            text: "Ang 0.999 - 0.998 ay ______?",
            options: ["0.001", "0.01", "0.1", "0"],
            answer: "0.001",
            feedback: "Ang pagbawas sa thousandths place ay nagreresulta sa 0.001."
          },
          {
            id: "ALIGN-Q10-10-09",
            text: "Pwede ba isulat ang 0.999 - 0.998 bilang 0.999 + (-0.998)?",
            options: ["Oo", "Hindi", "Depende", "Hindi sigurado"],
            answer: "Oo",
            feedback: "Ang subtraction ay pwedeng isulat bilang addition ng negative: a - b = a + (-b)."
          },
          {
            id: "ALIGN-Q10-10-10",
            text: "Anong sagot sa 0.999 - 0.998?",
            options: ["0.1", "0.01", "0.001", "0.0001"],
            answer: "0.001",
            feedback: "Ang sagot ay 0.001."
          }
        ]
      },
      // Question 11: Figure 1 - Students below 84
      {
        id: "RMA-Q10-11",
        text: "[Refer to Figure 1] Based on the graph in Figure 1, how many students had an overall academic grade below 84?",
        options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
        answer: "5",
        type: "rma",
        category: "Data Analysis",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-11-01",
            text: "Sa graph sa Figure 1, ilang mag-aaral ang may average grade na mas mababa sa 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Sa pamamagitan ng pagbilang ng mga data points sa ibaba ng 84-grade line sa y-axis, may 5 mag-aaral."
          },
          {
            id: "ALIGN-Q10-11-02",
            text: "Ang graph ay nagpapakita ng academic grades vs absences. Ilang students ang may grade below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Bilangin ang mga points sa ibaba ng line 84 sa y-axis. May 5 students."
          },
          {
            id: "ALIGN-Q10-11-03",
            text: "Si Kuya John ay nag-aaral ng graph. Ilang mag-aaral ang may grade na below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "By counting the points below the 84 line on the y-axis, you find 5 students."
          },
          {
            id: "ALIGN-Q10-11-04",
            text: "Ang scatter plot ay nagpapakita ng grades vs absences. Ilang students ang may grade below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Count the data points below 84 on y-axis: 5 students."
          },
          {
            id: "ALIGN-Q10-11-05",
            text: "Sa pag-aaral ng data, ilang students ang may grade na mas mababa sa 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Count the specific data points below the 84-grade mark: 5 students."
          },
          {
            id: "ALIGN-Q10-11-06",
            text: "Ang Figure 1 ay nagpapakita ng academic data. Ilang students ang may grade below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "By counting data points below the 84 line on y-axis: 5 students."
          },
          {
            id: "ALIGN-Q10-11-07",
            text: "Si Aling Maria ay gumagawa ng pag-aaral. Ilang students ang may grade na below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Count data points below 84 on y-axis: 5 students."
          },
          {
            id: "ALIGN-Q10-11-08",
            text: "Sa graph sa Figure 1, ilang mag-aaral ang may grade na mas mababa kaysa 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Bilangin ang mga data points na nasa ibaba ng 84 sa y-axis: 5 mag-aaral."
          },
          {
            id: "ALIGN-Q10-11-09",
            text: "Ang graph ay nagpapakita ng relasyon ng absences at grades. Ilang mag-aaral ang may grade below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Sa pamamagitan ng pagtingin sa vertical axis, bilangin ang points sa ibaba ng 84: 5 mag-aaral."
          },
          {
            id: "ALIGN-Q10-11-10",
            text: "Paano matutukoy ang bilang ng mga mag-aaral na may grade below 84?",
            options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
            answer: "5",
            feedback: "Count the data points below the horizontal line representing grade 84: 5 students."
          }
        ]
      },
      // Question 12: How to determine students below 84
      {
        id: "RMA-Q10-12",
        text: "[Refer to Figure 1] How do you determine students below 84?",
        options: [
          "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
          "Counting the data points on the x-axis.",
          "Looking at the highest grade achieved.",
          "Averaging all the grades."
        ],
        answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
        type: "rma",
        category: "Data Analysis",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-12-01",
            text: "Paano mo matutukoy ang mga mag-aaral na may grade na mas mababa sa 84 sa Figure 1?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Sa pagbilang ng data points na nasa ibaba ng horizontal line na kumakatawan sa grade 84 sa y-axis."
          },
          {
            id: "ALIGN-Q10-12-02",
            text: "Ang graph ay nagpapakita ng grades vs absences. Paano tukuyin ang below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "To find students below threshold, count data points below the horizontal line on y-axis."
          },
          {
            id: "ALIGN-Q10-12-03",
            text: "Sa pag-aaral ng academic data, paano matukoy ang mga students na may grade below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Look at the vertical axis and count points strictly below the threshold value."
          },
          {
            id: "ALIGN-Q10-12-04",
            text: "Si Mang Pedro ay nag-aanalyze ng graph. Paano niya matutukoy ang mga mag-aaral na may grade na below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Count the data points below the horizontal line representing grade 84 on the y-axis."
          },
          {
            id: "ALIGN-Q10-12-05",
            text: "Paano tukuyin sa graph ang mga students na may grade na mas mababa sa 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Count the points below the horizontal line at grade 84 on the y-axis."
          },
          {
            id: "ALIGN-Q10-12-06",
            text: "Sa Figure 1, paano matutukoy ang mga mag-aaral na may grade na below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "To determine students below 84, count data points below the horizontal line on y-axis."
          },
          {
            id: "ALIGN-Q10-12-07",
            text: "Ang y-axis ay grades. Paano tukuyin ang below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Count the data points that fall below the horizontal line at 84 on the y-axis."
          },
          {
            id: "ALIGN-Q10-12-08",
            text: "Si Aling Rosa ay gumagawa ng pag-aaral. Paano tukuyin ang mga students na may grade na below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Count the data points below the horizontal line representing grade 84 on y-axis."
          },
          {
            id: "ALIGN-Q10-12-09",
            text: "Paano matutukoy ang mga mag-aaral na may grade na mas mababa sa 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "Count data points below the horizontal line at grade 84 on the y-axis."
          },
          {
            id: "ALIGN-Q10-12-10",
            text: "Sa pag-aaral ng data, paano matutukoy ang mga students na may grade na below 84?",
            options: [
              "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
              "Counting the data points on the x-axis.",
              "Looking at the highest grade achieved.",
              "Averaging all the grades."
            ],
            answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
            feedback: "To find students below grade threshold, count points below the line on y-axis."
          }
        ]
      },
      // Question 13: Correlation interpretation
      {
        id: "RMA-Q10-13",
        text: "[Refer to Figure 1] Which of the following can be a correct interpretation of the data presented in the graph in Figure 1?",
        options: [
          "As the number of absences increases, the overall academic grade also increases.",
          "As the number of absences decreases, the overall academic grade increases.",
          "As the number of absences increases, the overall academic grade decreases.",
          "As the number of absences decreases, the overall academic grade also decreases."
        ],
        answer: "As the number of absences increases, the overall academic grade decreases.",
        type: "rma",
        category: "Data Analysis",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-13-01",
            text: "Alin sa mga sumusunod ang tamang interpretasyon ng data na ipinapakita sa graph sa Figure 1?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Ang scatter plot ng absences vs grades ay karaniwang nagpapakita ng negative correlation: mas maraming absences, mas mababa ang grades."
          },
          {
            id: "ALIGN-Q10-13-02",
            text: "Sa graph, ang x-axis ay absences at y-axis ay grades. Anong interpretasyon ang tama?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Ang graph ay nagpapakita ng negative correlation: habang dumarami ang absences, bumababa ang grades."
          },
          {
            id: "ALIGN-Q10-13-03",
            text: "Ang graph ay nagpapakita ng relasyon ng absences at grades. Anong tamang interpretasyon?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "The scatter plot shows a negative correlation: as absences increase, academic grades decrease."
          },
          {
            id: "ALIGN-Q10-13-04",
            text: "Si Mang Pedro ay nag-aaral ng graph. Anong tamang interpretasyon?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "The graph shows negative correlation: more absences lead to lower academic grades."
          },
          {
            id: "ALIGN-Q10-13-05",
            text: "Sa pag-aaral ng academic data, anong interpretasyon ang tama?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Ang tamang interpretasyon: Habang tumataas ang bilang ng absences, bumababa ang overall academic grade."
          },
          {
            id: "ALIGN-Q10-13-06",
            text: "Ang scatter plot ay nagpapakita ng absences vs grades. Anong tamang interpretasyon?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "The plot shows negative correlation: as one variable increases, the other decreases."
          },
          {
            id: "ALIGN-Q10-13-07",
            text: "Sa Figure 1, anong relasyon ang ipinapakita?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Ang graph ay nagpapakita ng negative correlation: habang tumataas ang absences, bumababa ang grades."
          },
          {
            id: "ALIGN-Q10-13-08",
            text: "Ang data ay nagpapakita ng absences at academic grades. Anong tamang interpretasyon?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Correct interpretation: As absences increase, academic grades decrease (negative correlation)."
          },
          {
            id: "ALIGN-Q10-13-09",
            text: "Si Kuya John ay nag-aaral. Anong interpretasyon ng graph?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "The graph shows: as the number of absences increases, the overall academic grade decreases."
          },
          {
            id: "ALIGN-Q10-13-10",
            text: "Anong interpretasyon ang tamang-tama sa data?",
            options: [
              "As the number of absences increases, the overall academic grade also increases.",
              "As the number of absences decreases, the overall academic grade increases.",
              "As the number of absences increases, the overall academic grade decreases.",
              "As the number of absences decreases, the overall academic grade also decreases."
            ],
            answer: "As the number of absences increases, the overall academic grade decreases.",
            feedback: "Tamang interpretasyon: Habang tumataas ang bilang ng absences, bumababa ang overall academic grade."
          }
        ]
      },
      // Question 14: Figure 2 - Diversity in income
      {
        id: "RMA-Q10-14",
        text: "Based on the graph in Figure 2, which of the two puroks shows more diversity in monthly family income? Explain or justify your answer.",
        options: [
          "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
          "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
        ],
        answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-14-01",
            text: "Batay sa graph sa Figure 2, aling purok ang nagpapakita ng mas malaking pagkakaiba-iba sa monthly family income?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Sa Figure 2, ang mga bar para sa Purok 2 ay mas kalat-kalat. May ilang pamilya na kumikita ng napakakonti habang may iba na kumikita ng mas marami. Ang malawak na pagkakat ay nagpapakita ng mas malaking pagkakaiba-iba."
          },
          {
            id: "ALIGN-Q10-14-02",
            text: "Sa bar graph ng income, aling purok ang may mas diverse na data?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 has bars spread across different income levels, showing more diversity."
          },
          {
            id: "ALIGN-Q10-14-03",
            text: "Ang graph ay nagpapakita ng income distribution. Aling purok ang may mas diversity?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 shows greater diversity in income levels based on the spread of bars."
          },
          {
            id: "ALIGN-Q10-14-04",
            text: "Si Aling Maria ay nag-aaral ng income data. Aling purok ang may mas magkakaiba?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 shows more diversity as indicated by the spread of bars in the graph."
          },
          {
            id: "ALIGN-Q10-14-05",
            text: "Ang bar graph ay nagpapakita ng income ng dalawang purok. Aling purok ang may mas diversity?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "The spread out bars in Purok 2 indicate that families have very different income levels."
          },
          {
            id: "ALIGN-Q10-14-06",
            text: "Batay sa Figure 2, aling purok ang may mas maraming variation sa income?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Ang Purok 2 ay may mas malawak na pagkakat ng bars sa graph, nagpapakita ng mas maraming variation."
          },
          {
            id: "ALIGN-Q10-14-07",
            text: "Sa income graph, aling purok ang nagpapakita ng mas diversity?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 has bars spread across a wider range of income levels."
          },
          {
            id: "ALIGN-Q10-14-08",
            text: "Ang graph sa Figure 2 ay nagpapakita ng income. Aling purok ang may mas diversity?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Ang mas kalat na bars sa Purok 2 ay nagpapakita ng mas diversity sa income levels."
          },
          {
            id: "ALIGN-Q10-14-09",
            text: "Si Kuya Pedro ay nag-aanalyze ng income data. Aling purok ang may mas magkakaiba?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 shows more diversity as indicated by the spread of bars in the graph."
          },
          {
            id: "ALIGN-Q10-14-10",
            text: "Sa bar graph, aling purok ang may mas malaking pagkakaiba sa income?",
            options: [
              "Purok 1 - The bars in the graph are close together, showing that most families have similar income levels.",
              "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high."
            ],
            answer: "Purok 2 - The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
            feedback: "Purok 2 has a wider spread of income levels, showing greater diversity."
          }
        ]
      },
      // Question 15: Financial aid decision
      {
        id: "RMA-Q10-15",
        text: "The average monthly income of the families in Purok 1 and Purok 2 are equal. Should both puroks be given the same amount of financial aid? What information in the graph in Figure 2 did you base your decision on?",
        options: [
          "Yes, because their averages are equal, so both should get the same amount of aid.",
          "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
          "Yes, because both have similar income distribution.",
          "No, because Purok 1 has higher income diversity."
        ],
        answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-15-01",
            text: "Ang average monthly income ng Purok 1 at Purok 2 ay pareho. Dapat ba silang bigyan ng parehong financial aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Bagaman pareho ang average, ang Purok 2 ay may mas malawak na range ng income. May ilang pamilya na kumikita ng napakakonti samantalang may iba na kumikita ng mas marami. Ang malaking pagkakaiba ay nangangailangan ng mas maraming tulong para sa mga pamilyang mahihirapan."
          },
          {
            id: "ALIGN-Q10-15-02",
            text: "Si Aling Maria ay nagpapasya tungkol sa financial aid. Anong desisyon?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Even with equal averages, Purok 2 has greater income inequality, so some families need more aid."
          },
          {
            id: "ALIGN-Q10-15-03",
            text: "Ang dalawang purok ay may parehong average income. Dapat ba silang bigyan ng parehong aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Purok 2 has wider income range, meaning some families struggle more and need additional financial aid."
          },
          {
            id: "ALIGN-Q10-15-04",
            text: "Si Kuya Pedro ay nag-aaral ng financial aid. Dapat ba pareho ang aid para sa Purok 1 at 2?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Purok 2 needs more targeted aid due to greater income variation within the community."
          },
          {
            id: "ALIGN-Q10-15-05",
            text: "Ang average income ay pareho. Dapat ba pareho ang financial aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Even with equal averages, Purok 2 has families with much lower incomes that need more help."
          },
          {
            id: "ALIGN-Q10-15-06",
            text: "Sa pagbibigay ng financial aid, ano ang tamang desisyon?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Purok 2 requires different aid amounts due to income variation, not uniform aid."
          },
          {
            id: "ALIGN-Q10-15-07",
            text: "Ang Purok 1 at Purok 2 ay may parehong average. Dapat ba pareho ang aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "The variation in Purok 2 means some families need more aid than others."
          },
          {
            id: "ALIGN-Q10-15-08",
            text: "Si Mang Tomas ay nagpapasya. Dapat ba pareho ang financial aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Purok 2 has greater income inequality, requiring different aid amounts."
          },
          {
            id: "ALIGN-Q10-15-09",
            text: "Ang average ay pareho. Paano magdesisyon tungkol sa financial aid?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "Purok 2 needs targeted aid due to income variation, not uniform aid."
          },
          {
            id: "ALIGN-Q10-15-10",
            text: "Dapat ba pareho ang financial aid para sa dalawang purok?",
            options: [
              "Yes, because their averages are equal, so both should get the same amount of aid.",
              "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
              "Yes, because both have similar income distribution.",
              "No, because Purok 1 has higher income diversity."
            ],
            answer: "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            feedback: "No, Purok 2 has greater income variation, so aid should be based on individual family needs."
          }
        ]
      },
      // Question 16: Table 2 - Music participants
      {
        id: "RMA-Q10-16",
        text: "[Refer to Table 2] Based on Table 2, how many students participated in the music activity?",
        options: ["18", "31", "49", "60"],
        answer: "49",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-16-01",
            text: "Batay sa Table 2, ilang mag-aaral ang sumali sa music activity?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Kailangan mong i-add ang bilang ng mga mag-aaral na sumali exclusive sa music at ang mga sumali sa music at sports."
          },
          {
            id: "ALIGN-Q10-16-02",
            text: "Sa Table 2, ilang students ang nag-participate sa music?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Add students who participated exclusively in music to those who participated in both music and sports."
          },
          {
            id: "ALIGN-Q10-16-03",
            text: "Ang Table 2 ay nagpapakita ng participation data. Ilang mag-aaral ang sumali sa music?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Add exclusive music participants + both music and sports participants = 49."
          },
          {
            id: "ALIGN-Q10-16-04",
            text: "Si Aling Maria ay nagbilang ng participants. Ilang sumali sa music?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "You must add the number of students who participated exclusively in music to those who participated in both."
          },
          {
            id: "ALIGN-Q10-16-05",
            text: "Sa pag-aaral ng Table 2, ilang mag-aaral ang sumali sa music activity?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Music participants = exclusive music + both music and sports = 49."
          },
          {
            id: "ALIGN-Q10-16-06",
            text: "Ang Table 2 ay nagpapakita ng data ng mga activities. Ilang mag-aaral ang sumali sa music?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Count all students who participated in music (exclusive + both) = 49."
          },
          {
            id: "ALIGN-Q10-16-07",
            text: "Si Kuya Pedro ay nag-aaral ng Table 2. Ilang sumali sa music activity?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Add exclusive music participants to both music and sports participants: 49."
          },
          {
            id: "ALIGN-Q10-16-08",
            text: "Batay sa Table 2, ilang students ang nag-participate sa music?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Exclusive music + both activities = 49 students participated in music."
          },
          {
            id: "ALIGN-Q10-16-09",
            text: "Sa Table 2, ilang mag-aaral ang sumali sa music activity?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Total music participants = 49 (exclusive + both)."
          },
          {
            id: "ALIGN-Q10-16-10",
            text: "Anong bilang ng mga mag-aaral na sumali sa music activity batay sa Table 2?",
            options: ["18", "31", "49", "60"],
            answer: "49",
            feedback: "Add students who participated exclusively in music to those who participated in both activities."
          }
        ]
      },
      // Question 17: Table 2 - Did not participate
      {
        id: "RMA-Q10-17",
        text: "[Refer to Table 2] Based on Table 2, how many students did not participate in any of the two activities?",
        options: ["18", "19", "31", "42"],
        answer: "19",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-17-01",
            text: "Batay sa Table 2, ilang mag-aaral ang hindi sumali sa alinman sa dalawang activities?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "Ito ang bilang na matatagpuan sa 'None' o 'Neither' category sa Venn diagram o two-way table."
          },
          {
            id: "ALIGN-Q10-17-02",
            text: "Sa Table 2, ilang students ang hindi sumali sa music o sports?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "This is the number in the 'None' category: 19 students."
          },
          {
            id: "ALIGN-Q10-17-03",
            text: "Ang Table 2 ay nagpapakita ng participation. Ilang hindi sumali sa alinman?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "The 'Neither' category shows students who did not participate in any activity: 19."
          },
          {
            id: "ALIGN-Q10-17-04",
            text: "Si Aling Maria ay nagbilang. Ilang mag-aaral ang hindi sumali sa anumang activity?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "Students who did not participate in any of the two activities: 19."
          },
          {
            id: "ALIGN-Q10-17-05",
            text: "Sa pag-aaral ng Table 2, ilang students ang hindi sumali sa alinman?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "The number located in the 'None' or 'Neither' category: 19."
          },
          {
            id: "ALIGN-Q10-17-06",
            text: "Ang Table 2 ay nagpapakita ng data. Ilang mag-aaral ang walang participation?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "Students who did not participate in any activity: 19 (from Neither category)."
          },
          {
            id: "ALIGN-Q10-17-07",
            text: "Si Kuya Pedro ay nag-aaral ng Table 2. Ilang hindi sumali sa alinman?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "Students who did not participate in any activity: 19."
          },
          {
            id: "ALIGN-Q10-17-08",
            text: "Batay sa Table 2, ilang mag-aaral ang walang nagawa?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "The 'None' category in the table shows: 19 students."
          },
          {
            id: "ALIGN-Q10-17-09",
            text: "Sa Table 2, ilang students ang hindi sumali sa music o sports?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "Students who did not participate in any of the two activities: 19."
          },
          {
            id: "ALIGN-Q10-17-10",
            text: "Anong bilang ng mga mag-aaral na hindi sumali sa alinman sa dalawang activities?",
            options: ["18", "19", "31", "42"],
            answer: "19",
            feedback: "From Table 2, the number in the Neither category is 19."
          }
        ]
      },
      // Question 18: Table 2 - Probability
      {
        id: "RMA-Q10-18",
        text: "[Refer to Table 2] Based on Table 2, what is the probability of selecting a student who participated in both music and sports activities?",
        options: [
          "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
          "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
          "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
          "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
        ],
        answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
        type: "rma",
        category: "Probability",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-18-01",
            text: "Batay sa Table 2, ano ang probability na piliin ang isang mag-aaral na sumali sa music at sports activities?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Sa Table 2, may 110 mag-aaral sa kabuuan. Sa mga ito, 18 mag-aaral ang sumali sa music at sports. Para makahanap ng probability, hinahati natin ang bilang ng mga mag-aaral na sumali sa dalawa (18) sa total na bilang ng mga mag-aaral (110)."
          },
          {
            id: "ALIGN-Q10-18-02",
            text: "Sa Table 2, ano ang probability ng both music at sports?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "In Table 2, 18 students joined both activities out of 110 total. Probability = 18/110."
          },
          {
            id: "ALIGN-Q10-18-03",
            text: "Ang Table 2 ay nagpapakita ng participation. Ano ang probability ng both activities?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Probability = Both participants / Total students = 18/110."
          },
          {
            id: "ALIGN-Q10-18-04",
            text: "Si Aling Maria ay nagkalkula ng probability. Ano ang sagot?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "From Table 2: 18 students joined both out of 110. Probability = 18/110."
          },
          {
            id: "ALIGN-Q10-18-05",
            text: "Sa pag-aaral ng Table 2, ano ang probability?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Probability = Number who joined both / Total number = 18/110."
          },
          {
            id: "ALIGN-Q10-18-06",
            text: "Ang Table 2 ay nagpapakita ng data ng 110 students. Ano ang probability?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Both music and sports participants: 18. Total students: 110. Probability = 18/110."
          },
          {
            id: "ALIGN-Q10-18-07",
            text: "Si Kuya Pedro ay nag-aaral ng probability. Ano ang tamang sagot?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Probability = 18/110 based on Table 2 data."
          },
          {
            id: "ALIGN-Q10-18-08",
            text: "Batay sa Table 2, ano ang probability na piliin ang isa na sumali sa both activities?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Sa Table 2, 18 students joined both out of 110. Probability = 18/110."
          },
          {
            id: "ALIGN-Q10-18-09",
            text: "Sa Table 2, ilang students ang sumali sa both activities?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "Probability = Number both / Total = 18/110."
          },
          {
            id: "ALIGN-Q10-18-10",
            text: "Anong probability ng pagpili ng isang mag-aaral na sumali sa both music at sports?",
            options: [
              "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
              "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
              "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
              "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
            ],
            answer: "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            feedback: "From Table 2: 18 joined both, 110 total. Probability = 18/110."
          }
        ]
      },
      // Question 19: Table 2 - Answerable question
      {
        id: "RMA-Q10-19",
        text: "[Refer to Table 2] Which of the following is a question that can be answered using the information in Table 2?",
        options: [
          "What is the favorite sport of the students?",
          "How many students participated in sports activity but not in music activity?",
          "What time did the music activity start?",
          "How many teachers organized the activities?"
        ],
        answer: "How many students participated in sports activity but not in music activity?",
        type: "rma",
        category: "Statistics",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-19-01",
            text: "Alin sa mga sumusunod ang tanong na masasagot gamit ang impormasyon sa Table 2?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "Ang two-way table para sa participation ay nagpapakita ng bilang ng mga mag-aaral bawat kategorya, hindi qualitative data tulad ng oras, paboritong sports, o bilang ng guro."
          },
          {
            id: "ALIGN-Q10-19-02",
            text: "Sa Table 2, aling tanong ang masasagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "A two-way table shows numbers, not qualitative data like time or preferences."
          },
          {
            id: "ALIGN-Q10-19-03",
            text: "Ang Table 2 ay nagpapakita ng data. Aling tanong ang masasagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "The table provides participation data, not qualitative information."
          },
          {
            id: "ALIGN-Q10-19-04",
            text: "Si Aling Maria ay nag-aaral ng Table 2. Aling tanong ang masasagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "The table contains participation data, so questions about counts can be answered."
          },
          {
            id: "ALIGN-Q10-19-05",
            text: "Sa pag-aaral ng Table 2, aling tanong ang may sagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "A two-way table for participation shows numbers of students per category, so this question can be answered."
          },
          {
            id: "ALIGN-Q10-19-06",
            text: "Ang Table 2 ay nagpapakita ng participation data. Aling tanong ang masasagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "Questions about participation counts can be answered from the table."
          },
          {
            id: "ALIGN-Q10-19-07",
            text: "Si Kuya Pedro ay nag-aaral. Aling tanong ang may sagot sa Table 2?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "The table provides numerical data about participation, so this question can be answered."
          },
          {
            id: "ALIGN-Q10-19-08",
            text: "Batay sa Table 2, aling tanong ang masasagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "A question that can be answered: participation counts from the two-way table."
          },
          {
            id: "ALIGN-Q10-19-09",
            text: "Sa Table 2, aling tanong ang may sagot?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "Participation count questions can be answered from the table data."
          },
          {
            id: "ALIGN-Q10-19-10",
            text: "Anong tanong ang masasagot gamit ang Table 2?",
            options: [
              "What is the favorite sport of the students?",
              "How many students participated in sports activity but not in music activity?",
              "What time did the music activity start?",
              "How many teachers organized the activities?"
            ],
            answer: "How many students participated in sports activity but not in music activity?",
            feedback: "The table shows participation data, so questions about how many students participated can be answered."
          }
        ]
      },
      // Question 20: Figure 3 - Position of point F
      {
        id: "RMA-Q10-20",
        text: "[Refer to Figure 3] What is the position of point F in Figure 3?",
        options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
        answer: "Point F is at -300.",
        type: "rma",
        category: "Coordinate Geometry",
        masteryRate: 0,
        alignedQuestions: [
          {
            id: "ALIGN-Q10-20-01",
            text: "Sa Figure 3, saan matatagpuan ang point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Sa pamamagitan ng pagbilang ng mga interval mula sa zero sa number line sa negative direction, ang F ay nasa -300."
          },
          {
            id: "ALIGN-Q10-20-02",
            text: "Ang Figure 3 ay nagpapakita ng number line. Saan ang position ng point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "By counting intervals from zero in the negative direction, F is at -300."
          },
          {
            id: "ALIGN-Q10-20-03",
            text: "Si Mang Pedro ay tumitingin sa Figure 3. Saan ang point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Counting intervals from zero on the negative side, F lands on -300."
          },
          {
            id: "ALIGN-Q10-20-04",
            text: "Sa number line sa Figure 3, anong position ng point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Point F is located at -300 on the number line."
          },
          {
            id: "ALIGN-Q10-20-05",
            text: "Ang point F sa Figure 3 ay nasaan?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "By counting intervals from zero in the negative direction on the number line, F lands on -300."
          },
          {
            id: "ALIGN-Q10-20-06",
            text: "Sa Figure 3, saan matatagpuan ang point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Counting intervals from zero, F is at -300."
          },
          {
            id: "ALIGN-Q10-20-07",
            text: "Ang Figure 3 ay nagpapakita ng number line. Anong position ng F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Point F is positioned at -300 on the number line."
          },
          {
            id: "ALIGN-Q10-20-08",
            text: "Si Kuya John ay nag-aaral ng Figure 3. Saan ang point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "F is located at -300 on the number line in Figure 3."
          },
          {
            id: "ALIGN-Q10-20-09",
            text: "Sa pag-aaral ng Figure 3, anong position ng point F?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "By counting the intervals from zero on the number line in the negative direction, F is at -300."
          },
          {
            id: "ALIGN-Q10-20-10",
            text: "Anong position ng point F sa Figure 3?",
            options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
            answer: "Point F is at -300.",
            feedback: "Point F is at -300 on the number line."
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
    document.getElementById('tabMasterMap').className = tabName === 'masterMap' ? 'secondary active-tab' : 'secondary';
    
    // Show/hide tab content
    document.getElementById('tabOverviewContent').hidden = tabName !== 'overview';
    document.getElementById('tabQuestionMapContent').hidden = tabName !== 'questionMap';
    document.getElementById('tabMasterMapContent').hidden = tabName !== 'masterMap';
    
    // Load content if needed
    if (tabName === 'questionMap') {
      // Set default grade for Question Map to 10 (as per user requirement)
      if (!currentGrade) {
        currentGrade = 10;
      }
      renderAllQuestions();
    }
    if (tabName === 'masterMap') {
      renderMasterMap();
    }
  }

  // ============================================
  // QUESTION MAP FUNCTIONS
  // ============================================
  
  /**
   * Get all questions for the current grade (RMA + Bank + Aligned)
   * If currentGrade is not set, defaults to Grade 10
   */
  function getAllQuestions() {
    // Default to Grade 10 for Question Map as per user requirement
    const grade = currentGrade || 10;
    const gradeQuestions = QUESTION_BANK[grade] || [];
    const bankQuestions = BANK_QUESTIONS[grade] || [];
    
    // Add aligned questions as separate entries
    const allQuestions = [];
    
    gradeQuestions.forEach(q => {
      allQuestions.push({ ...q, type: 'rma' });
      // Add aligned questions as individual entries
      if (q.alignedQuestions) {
        q.alignedQuestions.forEach((aligned, index) => {
          allQuestions.push({
            id: aligned.id,
            text: aligned.text,
            options: aligned.options,
            answer: aligned.answer,
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
      }
    });
    
    bankQuestions.forEach(q => {
      allQuestions.push({ ...q, type: 'bank' });
    });
    
    return allQuestions;
  }

  /**
   * Real per-question accuracy, built from submitted attempts.
   *
   * rma_data stores one bit per RMA item, so item N maps to
   * RMA-Q<grade>-<N, zero-padded to two digits>. Bank and aligned items are
   * not recorded per-item in a form that maps back to their ids (bank_data
   * uses bare item numbers, and aligned items are never submitted), so they
   * carry no mastery at all. They are left without a mastery value rather than
   * reported as 0%, which is what made the "High" and "Medium" filters return
   * an empty list while "Low" returned everything.
   */
  function computeQuestionMastery() {
    const grade = Number(currentGrade || 10);
    const totals = new Map();

    rows
      .filter((row) => Number(row.grade) === grade
        && row.score !== null && row.score !== undefined
        && row.is_complete !== false)
      .forEach((row) => {
        String(row.rma_data || "").split("|").forEach((answer, index) => {
          if (answer !== "0" && answer !== "1") return;
          const id = `RMA-Q${grade}-${String(index + 1).padStart(2, "0")}`;
          const total = totals.get(id) || { correct: 0, count: 0 };
          total.count += 1;
          if (answer === "1") total.correct += 1;
          totals.set(id, total);
        });
      });

    questionMastery = new Map([...totals.entries()].map(([id, total]) => [id, {
      rate: Math.round((total.correct / total.count) * 100),
      correct: total.correct,
      count: total.count
    }]));
  }

  function masteryFor(question) {
    return questionMastery.get(question.id) || null;
  }

  /**
   * Render all questions with filters
   */
  function renderAllQuestions() {
    const questions = getAllQuestions();
    const container = document.getElementById('questionsGrid');
    
    if (!container) return;
    
    computeQuestionMastery();
    
    container.innerHTML = questions.map(question => {
      const mastery = masteryFor(question);
      const rate = mastery ? mastery.rate : null;
      const masteryClass = rate === null ? 'mastery-none'
        : rate >= 80 ? 'mastery-high'
        : rate >= 60 ? 'mastery-medium' : 'mastery-low';
      const masteryText = rate === null ? 'No responses'
        : rate >= 80 ? 'HIGH' : rate >= 60 ? 'MEDIUM' : 'LOW';
      
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
        <div class="question-card" data-type="${question.type}" data-mastery="${masteryClass}" data-has-mastery="${rate === null ? 'no' : 'yes'}" data-category="${escapeHtml(question.category || '')}">
          <div class="question-header">
            <span class="question-id">${escapeHtml(question.id)}</span>
            <span class="question-type type-${question.type}">${question.type.toUpperCase()}</span>
            <span class="mastery-badge ${masteryClass}">${masteryText}${rate === null ? '' : `: ${rate}%`}</span>
            ${mastery ? `<span class="mastery-count">${mastery.correct}/${mastery.count} correct</span>` : ''}
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
      
      // Mastery filter. Bank and aligned items carry no mastery because their
      // responses cannot be keyed back to their ids, so they are excluded from
      // every band instead of being counted as low.
      if (masteryFilter !== 'all') {
        if (card.dataset.hasMastery !== 'yes') {
          show = false;
        } else if (masteryFilter === 'high' && !masteryClass.includes('high')) show = false;
        else if (masteryFilter === 'medium' && !masteryClass.includes('medium')) show = false;
        else if (masteryFilter === 'low' && !masteryClass.includes('low')) show = false;
      }
      
      card.style.display = show ? 'block' : 'none';
    });
  }

  // ============================================
  // MASTER MAP (Grades 7-10)
  // Every RMA question tagged by grade level, topic / mathematical
  // objective and cognitive process, sourced from the RMA question
  // mapping workbook (rma-master-map.js).
  // ============================================

  const MM_GRADES = [7, 8, 9, 10];
  const MM_COGNITIVE_ORDER = ["Knowing", "Interpreting", "Applying", "Reasoning", "Reasoning*"];
  let mmReady = false;

  function mmCogList() {
    const seen = (window.RMA_MASTER_MAP.cognitive || []).filter(c => c && c !== "—");
    return MM_COGNITIVE_ORDER.filter(c => seen.includes(c)).concat(seen.filter(c => !MM_COGNITIVE_ORDER.includes(c)));
  }

  function initMasterMap() {
    if (mmReady) return true;
    const map = window.RMA_MASTER_MAP;
    const gradeSel = document.getElementById("mmGrade");
    if (!map || !gradeSel) return false;

    MM_GRADES.forEach((g) => {
      gradeSel.insertAdjacentHTML("beforeend", `<option value="${g}">Grade ${g}</option>`);
    });
    (map.topics || []).forEach((topic) => {
      document.getElementById("mmTopic").insertAdjacentHTML("beforeend", `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`);
    });
    mmCogList().forEach((cog) => {
      document.getElementById("mmCognitive").insertAdjacentHTML("beforeend", `<option value="${escapeHtml(cog)}">${escapeHtml(cog)}</option>`);
    });

    document.getElementById("masterMapSource").textContent =
      `Every RMA question across Grades 7–10, tagged by grade level, topic / mathematical objective, and cognitive process. Source: ${map.source}`;

    ["mmGrade", "mmTopic", "mmCognitive", "mmType"].forEach((id) => {
      document.getElementById(id).addEventListener("change", renderMasterMap);
    });
    document.getElementById("mmSearch").addEventListener("input", renderMasterMap);
    document.getElementById("mmReset").addEventListener("click", resetMasterMapFilters);

    mmReady = true;
    renderBlueprint();
    return true;
  }

  function mmReadFilters() {
    return {
      grade: document.getElementById("mmGrade").value,
      topic: document.getElementById("mmTopic").value,
      cognitive: document.getElementById("mmCognitive").value,
      type: document.getElementById("mmType").value,
      search: document.getElementById("mmSearch").value.trim().toLowerCase()
    };
  }

  function mmMatches(row, filters, skip) {
    skip = skip || {};
    if (!skip.grade && filters.grade !== "all" && row.g !== Number(filters.grade)) return false;
    if (!skip.topic && filters.topic !== "all" && row.topic !== filters.topic) return false;
    if (!skip.cognitive && filters.cognitive !== "all" && row.cog !== filters.cognitive) return false;
    if (!skip.type && filters.type !== "all" && row.type !== filters.type) return false;
    if (filters.search) {
      const numeric = /^\d+$/.test(filters.search);
      const hit = numeric
        ? row.item === Number(filters.search)
        : String(row.q || "").toLowerCase().includes(filters.search) ||
          String(row.topic || "").toLowerCase().includes(filters.search);
      if (!hit) return false;
    }
    return true;
  }

  function renderMasterMap() {
    if (!initMasterMap()) return;
    const map = window.RMA_MASTER_MAP;
    const filters = mmReadFilters();
    const rows = map.questions.filter((row) => mmMatches(row, filters));

    const originals = rows.filter((row) => row.type === "RMA Original").length;
    const scope = filters.grade === "all" ? "Grades 7–10" : `Grade ${filters.grade}`;

    document.getElementById("masterMapSummary").innerHTML = [
      { label: "Questions in view", value: rows.length },
      { label: "RMA Original", value: originals },
      { label: "RMA Aligned", value: rows.length - originals },
      { label: "Topics covered", value: new Set(rows.map((row) => row.topic)).size }
    ].map((m) => `<div class="metric"><b>${m.value}</b><span>${m.label}</span></div>`).join("");

    document.getElementById("masterMapCount").textContent =
      `Showing ${rows.length} of ${map.questions.length} mapped questions · ${scope}`;

    const body = document.getElementById("masterMapRows");
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="7" class="mm-empty">No questions match the selected filters.</td></tr>`;
    } else {
      body.innerHTML = rows.map((row) => `
        <tr>
          <td class="mm-num"><span class="tag tag-grade">Grade ${row.g}</span></td>
          <td class="mm-num">${row.id}</td>
          <td class="mm-item-ref">${row.item ? `RMA ${row.item}` : "—"}</td>
          <td><span class="tag tag-topic">${escapeHtml(row.topic || "Untagged")}</span></td>
          <td><span class="tag tag-cog">${escapeHtml(row.cog === "—" ? "n/a" : row.cog || "n/a")}</span></td>
          <td><span class="tag ${row.type === "RMA Original" ? "tag-type-original" : "tag-type-aligned"}">${escapeHtml(row.type || "")}</span></td>
          <td>${escapeHtml(row.q || "")}</td>
        </tr>`).join("");
    }

    renderMasterMapTopicCounts(filters);
  }

  function renderMasterMapTopicCounts(filters) {
    const map = window.RMA_MASTER_MAP;
    const scoped = map.questions.filter((row) => mmMatches(row, filters, { topic: true, cognitive: true }));
    const counts = new Map();
    scoped.forEach((row) => {
      const key = row.topic || "Untagged";
      const entry = counts.get(key) || { total: 0, original: 0 };
      entry.total += 1;
      if (row.type === "RMA Original") entry.original += 1;
      counts.set(key, entry);
    });
    const ordered = [...counts.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));
    document.getElementById("masterMapTopicCounts").innerHTML = ordered.map(([topic, c]) => `
      <div class="mm-topic-count">
        <strong>${escapeHtml(topic)}</strong><br>
        ${c.total} question${c.total === 1 ? "" : "s"} · ${c.original} RMA Original
      </div>`).join("");
  }

  function renderBlueprint() {
    const map = window.RMA_MASTER_MAP;
    const body = document.getElementById("blueprintRows");
    if (!map || !body) return;
    body.innerHTML = (map.items || []).map((item) => {
      const local = MM_GRADES.filter((g) => item.local[g]).map((g) => `G${g}: ${item.local[g]}`).join(" · ");
      return `
        <tr>
          <td class="mm-num">${item.n}</td>
          <td><span class="tag tag-topic">${escapeHtml(item.topic || "Untagged")}</span></td>
          <td><span class="tag tag-cog">${escapeHtml(item.cog || "n/a")}</span></td>
          <td class="mm-num">${item.grades.map((g) => `G${g}`).join(", ")}</td>
          <td class="mm-local">${local || "—"}</td>
          <td>${escapeHtml(item.q || "")}</td>
        </tr>`;
    }).join("");
  }

  function resetMasterMapFilters() {
    if (!initMasterMap()) return;
    ["mmGrade", "mmTopic", "mmCognitive", "mmType"].forEach((id) => { document.getElementById(id).value = "all"; });
    document.getElementById("mmSearch").value = "";
    renderMasterMap();
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

  // A learner record has three distinct states. "No result" must never be
  // confused with "scored badly", and an attempt the student did not finish is
  // different again from one that was never started.
  function statusFor(score, attemptNumber = null, isComplete = null) {
    if (score === null || score === undefined) {
      if (attemptNumber && attemptNumber > 0) {
        return { label: "Incomplete", className: "status-incomplete", band: null, state: "incomplete" };
      }
      return { label: "Not yet taken", className: "status-not-taken", band: null, state: "not-taken" };
    }

    if (isComplete === false) {
      return { label: "Incomplete", className: "status-incomplete", band: null, state: "incomplete" };
    }

    const scoreNum = Number(score);
    const band = scoreBands.find(b => scoreNum >= b.min_score && scoreNum <= b.max_score);
    
    if (band) {
      return { 
        label: band.label, 
        className: `status-${band.band_name}`, 
        band: band,
        state: "complete"
      };
    }
    
    return { label: "Unknown", className: "status-pending", band: null, state: "complete" };
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
    const hasScore = (r) => r.score !== null && r.score !== undefined;
    const completed = filteredRows.filter(r => hasScore(r) && r.is_complete !== false).length;
    const incomplete = filteredRows.filter(r => hasScore(r) && r.is_complete === false).length;
    const notTaken = filteredRows.filter(r => !hasScore(r)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const nameOf = (r) => r.student_name || `${r.last_name}, ${r.first_name}`;
    const notTakenList = filteredRows
      .filter(r => !hasScore(r))
      .map(r => ({ student_code: r.student_code, student_name: nameOf(r), section: r.section }));
    
    const incompleteList = filteredRows
      .filter(r => hasScore(r) && r.is_complete === false)
      .map(r => ({ student_code: r.student_code, student_name: nameOf(r), section: r.section,
        attempt_number: r.attempt_number, created_at: r.created_at }));
    
    return {
      total,
      completed,
      incomplete,
      notTaken,
      completionRate,
      notTakenList,
      incompleteList
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
      const status = statusFor(row.score, row.attempt_number, row.is_complete);
      if (status.band) {
        counts[status.band.band_name] = (counts[status.band.band_name] || 0) + 1;
      }
    });
    
    return counts;
  }
  
  function getScopedLearners(rows, grade, section) {
    const filteredRows = section
      ? rows.filter(r => Number(r.grade) === grade && r.section === section)
      : rows.filter(r => Number(r.grade) === grade);

    return filteredRows.map(r => ({
      student_id: r.student_id,
      student_code: r.student_code,
      student_name: r.student_name || `${r.last_name}, ${r.first_name}`,
      score: r.score,
      status: statusFor(r.score, r.attempt_number, r.is_complete),
      section: r.section,
      created_at: r.created_at,
      attempt_number: r.attempt_number,
      weakTopics: getWeakTopics(r)
    }));
  }

  // Anything below "proficient" needs attention, and an unfinished attempt
  // needs attention regardless of the score it managed to record. This defines
  // the card's default group, not a limit on what the chips may show. The chips
  // count every learner in scope, so the list has to start from all of them:
  // restricting it here meant "proficient" and "developing" could be selected
  // but never matched anything, because those learners were never in the list.
  function needsAttention(learner) {
    return learner.status.state === "incomplete"
      || (learner.status.band && ['needs_support', 'emerging'].includes(learner.status.band.band_name));
  }

  function getPriorityLearners(rows, grade, section) {
    return getScopedLearners(rows, grade, section)
      .filter(needsAttention)
      .sort((a, b) => {
        // Incomplete attempts first: they are the ones a teacher can act on today.
        if (a.status.state !== b.status.state) {
          return a.status.state === "incomplete" ? -1 : 1;
        }
        if (a.score !== b.score) {
          return (a.score || 0) - (b.score || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }

  // ============================================
  // WHO NEEDS HELP? - band filter
  // A teacher should be able to click a band and immediately see only the
  // learners in it, rather than reading a list and filtering it mentally.
  // ============================================

  // The card's default group. Every chip count has to match what the list
  // actually shows, so "Needs help" and "All learners" are separate chips
  // rather than one "All learners" chip that quietly meant "needs help".
  const NEEDS_HELP = "needs-help";
  let priorityBandFilter = NEEDS_HELP;
  let interventionReady = false;
  let lastDashboardRefresh = null;
  let priorityCache = { scoped: [], stats: null, levels: null, needsHelp: 0 };

  function priorityMatchesBand(learner, key) {
    if (!key || key === "all") return true;
    if (key === NEEDS_HELP) return needsAttention(learner);
    if (key === "incomplete") return learner.status.state === "incomplete";
    return Boolean(learner.status.band) && learner.status.band.band_name === key;
  }

  function renderPriorityFilter(levels, stats, needsHelpCount) {
    const container = document.getElementById("priorityFilterContainer");
    if (!container) return;

    const chips = [{ key: NEEDS_HELP, label: "Needs help", icon: "🎯", count: needsHelpCount }];
    scoreBands.forEach((band) => {
      chips.push({ key: band.band_name, label: band.label, icon: band.icon, count: (levels && levels[band.band_name]) || 0, color: band.color });
    });
    chips.push({ key: "incomplete", label: "Incomplete", icon: "⚠️", count: stats.incomplete });
    chips.push({ key: "not-taken", label: "Not yet taken", icon: "⏳", count: stats.notTaken });
    chips.push({ key: "all", label: "All learners", icon: "👥", count: stats.total });

    container.innerHTML = chips.map((chip) => `
      <button type="button" class="band-chip ${priorityBandFilter === chip.key ? "active" : ""}"
        data-band="${escapeHtml(chip.key)}" aria-pressed="${priorityBandFilter === chip.key}"
        ${chip.color ? `style="--chip-color:${chip.color}"` : ""}>
        <span class="band-chip-icon" aria-hidden="true">${chip.icon}</span>
        <span class="band-chip-label">${escapeHtml(chip.label)}</span>
        <span class="band-chip-count">${chip.count}</span>
      </button>`).join("");
  }

  function setPriorityBandFilter(key) {
    // Clicking the active chip returns to the default group rather than to an
    // undefined state that would show every learner and contradict the label.
    priorityBandFilter = priorityBandFilter === key ? NEEDS_HELP : key;
    interventionReady = false;
    const preset = document.getElementById("interventionPreset");
    if (preset && typeof preset.setAttribute === "function") preset.setAttribute("aria-pressed", "false");
    renderPriorityFilter(priorityCache.levels, priorityCache.stats, priorityCache.needsHelp);
    renderPriorityLearners(priorityCache.scoped, priorityCache.stats);
  }

  function setInterventionReady() {
    interventionReady = !interventionReady;
    priorityBandFilter = NEEDS_HELP;
    const preset = document.getElementById("interventionPreset");
    if (preset && typeof preset.setAttribute === "function") preset.setAttribute("aria-pressed", String(interventionReady));
    renderPriorityFilter(priorityCache.levels, priorityCache.stats, priorityCache.needsHelp);
    renderPriorityLearners(priorityCache.scoped, priorityCache.stats);
  }

  function renderPriorityPanel(priorityLearners, scopedLearners, stats, levels) {
    priorityCache = { scoped: scopedLearners, stats, levels, needsHelp: priorityLearners.length };
    const gaps = new Map();
    priorityLearners.forEach((learner) => {
      (learner.weakTopics || []).forEach((t) => {
        gaps.set(t.topic, (gaps.get(t.topic) || 0) + 1);
      });
    });
    const topGaps = [...gaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    priorityCache.gaps = topGaps;

    renderPriorityGapSummary(topGaps);
    renderPriorityFilter(levels, stats, priorityLearners.length);
    renderPriorityLearners(scopedLearners, stats);
  }

  function renderPriorityGapSummary(topGaps) {
    const node = document.getElementById("priorityGapSummary");
    if (!node) return;
    if (!topGaps.length) { node.hidden = true; node.innerHTML = ""; return; }
    node.hidden = false;
    node.innerHTML = `
      <span class="weak-topics-label">Most common learning gaps in this scope</span>
      <ul>
        ${topGaps.map(([topic, count]) => `
          <li><span class="tag tag-topic">${escapeHtml(topic)}</span>
          <span class="weak-topics-count">${count} learner${count === 1 ? "" : "s"}</span></li>`).join('')}
      </ul>`;
  }

  // scopedLearners is every learner in the report scope. Filtering starts from
  // that list, so selecting any band shows the learners the chip counted.
  function renderPriorityLearners(scopedLearners, stats) {
    const container = document.getElementById("priorityLearnersContainer");
    if (!container) return;

    const key = priorityBandFilter;
    const activeLabel = key && key !== "all"
      ? (key === NEEDS_HELP ? "Needs help"
        : key === "incomplete" ? "Incomplete"
        : key === "not-taken" ? "Not yet taken"
        : (scoreBands.find((b) => b.band_name === key) || {}).label || key)
      : null;
    const total = (stats && stats.total) || scopedLearners.length;

    if (key === "not-taken") {
      const list = (stats && stats.notTakenList) || [];
      container.innerHTML = `
        <div class="priority-stats">
          <span class="priority-count">${list.length} learner${list.length === 1 ? "" : "s"} — ${escapeHtml(activeLabel)}</span>
          <button type="button" class="priority-clear" onclick="setPriorityBandFilter('all')">Show all ${total}</button>
        </div>
        <div class="priority-list">
          ${list.length ? list.map((student) => `
            <div class="student-card-priority">
              <div class="student-header">
                <h4>${escapeHtml(student.student_name)}</h4>
                <span class="student-code">${escapeHtml(student.student_code)}</span>
                <span class="student-section">${escapeHtml(student.section)}</span>
              </div>
              <div class="student-score">
                <span class="score-value">—</span>
                <span class="status-badge status-not-taken">Not yet taken</span>
              </div>
            </div>`).join('') : '<p class="report-note">Every learner in this scope has taken the assessment.</p>'}
        </div>`;
      return;
    }

    const visible = scopedLearners.filter((learner) => priorityMatchesBand(learner, key));

    if (visible.length === 0) {
      const isBand = key && key !== "all" && key !== NEEDS_HELP && key !== "incomplete";
      container.innerHTML = `
        <div class="priority-stats">
          <span class="priority-count">No learners in ${escapeHtml(activeLabel || "this scope")}</span>
        </div>
        <p class="report-note">${key === NEEDS_HELP
          ? "No students currently need intensive support. Well done!"
          : isBand
            ? "Nobody in this scope landed in this band. Choose another group above."
            : "Nobody in this group needs remediation. Choose another band above."}</p>`;
      return;
    }

    container.innerHTML = `
      <div class="priority-tools">
        <span class="priority-count">${visible.length} learner${visible.length === 1 ? "" : "s"}${activeLabel ? ` — ${escapeHtml(activeLabel)}` : ""}</span>
        <span>${activeLabel ? `<button type="button" class="priority-clear" onclick="setPriorityBandFilter('all')">Show all ${total}</button>` : ''}
        ${interventionReady ? `<button type="button" class="priority-clear" onclick="printInterventionGroup()">Print plan</button>` : ''}
        <button type="button" class="priority-clear" onclick="exportInterventionGroup()">Export</button></span>
      </div>
      <div class="priority-list">
        ${visible.map(learner => `
          <div class="student-card-priority">
            <div class="student-header">
              <h4>${escapeHtml(learner.student_name)}</h4>
              <span class="student-code">${escapeHtml(learner.student_code)}</span>
              <span class="student-section">${escapeHtml(learner.section)}</span>
            </div>
            <div class="student-score">
              <span class="score-value">${learner.score === null || learner.score === undefined ? '—' : learner.score} / 30</span>
              <span class="status-badge ${escapeHtml(learner.status.className)}">${escapeHtml(learner.status.label)}</span>
            </div>
            <div class="student-meta">
              <span>Last: ${learner.created_at ? new Date(learner.created_at).toLocaleDateString() : '—'}</span>
              ${learner.attempt_number > 1 ? `<span>Attempt #${learner.attempt_number}</span>` : ''}
            </div>
            ${interventionReady ? renderTopSkill(learner) : learner.weakTopics && learner.weakTopics.length ? `
              <div class="weak-topics">
                <span class="weak-topics-label">Needs support in</span>
                <ul>
                  ${learner.weakTopics.map((t) => `
                    <li>
                      <span class="tag tag-topic">${escapeHtml(t.topic)}</span>
                      <span class="weak-topics-count">missed ${t.missed} of ${t.seen}</span>
                    </li>`).join('')}
                </ul>
              </div>` : `
              <div class="weak-topics">
                <span class="weak-topics-label">Needs support in</span>
                <p class="weak-topics-empty">No item-level answers were recorded for this attempt.</p>
              </div>`}
            <div class="student-actions">
              <button type="button" class="priority-clear" onclick="focusLearner('${escapeHtml(learner.student_code)}')">View record</button>
              ${learner.status.state === "incomplete"
                ? `<button type="button" class="priority-clear" onclick="setAttemptComplete('${escapeHtml(learner.student_code)}', true)">Mark attempt finished</button>`
                : `<button type="button" class="priority-clear" onclick="setAttemptComplete('${escapeHtml(learner.student_code)}', false)">Flag attempt as unfinished</button>`}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderTopSkill(learner) {
    const top = (learner.weakTopics || [])[0];
    return `<div class="weak-topics"><span class="weak-topics-label">Top missed skill</span>${top
      ? `<span class="tag tag-topic" title="${escapeHtml(`${top.missed} missed of ${top.seen} seen`)}">${escapeHtml(top.topic)}</span>`
      : '<span class="weak-topics-empty">No item data</span>'}</div>`;
  }

  function renderCompletionStatus(stats) {
    const container = document.getElementById("completionStatusContainer");
    if (!container) return;
    
    container.innerHTML = `
      <div class="completion-header">
        <h3>Grade ${escapeHtml(currentGrade)} - ${escapeHtml(currentSection || 'All Sections')}</h3>
        <div class="completion-bar-container">
          <div class="completion-bar">
            <div class="completion-fill" style="width: ${stats.completionRate}%"></div>
          </div>
          <span>${stats.completed} / ${stats.total} completed (${stats.completionRate}%)</span>
        </div>
      </div>
      <div class="completion-breakdown">
        <span class="status status-mastered">✅ Completed ${stats.completed}</span>
        <span class="status status-incomplete">⚠️ Incomplete ${stats.incomplete}</span>
        <span class="status status-not-taken">⏳ Not yet taken ${stats.notTaken}</span>
      </div>
      ${stats.incompleteList.length > 0 ? `
        <div class="not-taken-list">
          <h4>Incomplete — started but not finished (${stats.incompleteList.length})</h4>
          <ul>
            ${stats.incompleteList.map(student => `
              <li>${escapeHtml(student.student_name)} <span class="student-code-small">${escapeHtml(student.student_code)}</span> <span class="student-section-small">${escapeHtml(student.section)}</span>${student.attempt_number ? ` <span class="student-section-small">attempt ${escapeHtml(student.attempt_number)}</span>` : ''}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
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

  // ============================================
  // SECTION LEADERBOARDS (live + all time)
  // ============================================
  // "Live" is each student's most recent completed attempt, "all time" is their
  // personal best, so a student who improves is not punished for having sat the
  // assessment twice. Both come back scoped to the teacher and to the grade and
  // section currently selected above.
  function leaderboardRows(entries, scoreKey) {
    if (!Array.isArray(entries) || !entries.length) {
      return `<p class="report-note">No completed attempts in this scope yet.</p>`;
    }
    return `<ol class="leaderboard-list" aria-label="Ranked learners">${entries.map((row, index) => {
      const rank = Number(row.rank) || index + 1;
      const rankClass = rank <= 3 ? ` top-rank-${rank}` : "";
      return `
        <li class="leaderboard-entry${rankClass}">
          <span class="leaderboard-rank" aria-label="Rank ${escapeHtml(rank)}">${escapeHtml(rank)}</span>
          <div class="leaderboard-identity">
            <span class="learner-name">${escapeHtml(row.name || "—")}</span>
            ${row.student_code ? `<span class="learner-code">${escapeHtml(row.student_code)}</span>` : ""}
          </div>
          <div class="leaderboard-result"><b class="leaderboard-score">${escapeHtml(row[scoreKey] ?? "—")}</b><small>mastery %</small></div>
          <div class="leaderboard-meta">
            <span class="leaderboard-section">${escapeHtml(row.section || "—")}</span>
            <span>${escapeHtml(row.duration || "—")}</span>
            <span>${escapeHtml(row.attempts ?? 0)} attempts</span>
          </div>
        </li>`;
    }).join("")}</ol>`;
  }

  function renderLeaderboards(payload) {
    const live = document.getElementById("liveLeaderboard");
    const allTime = document.getElementById("allTimeLeaderboard");
    const note = document.getElementById("leaderboardNote");
    if (!live || !allTime) return;
    const data = payload || {};
    live.innerHTML = leaderboardRows(data.live, "score");
    allTime.innerHTML = leaderboardRows(data.all_time, "score");
    if (note) {
      const scope = `Grade ${currentGrade}${currentSection ? ` · ${currentSection}` : " · all sections"}`;
      note.textContent = `${scope}. Unfinished attempts are left off both lists.`;
      // The note ships hidden so an empty paragraph cannot pull the grid up under
      // the paragraph above it. Showing text has to reveal it again.
      note.hidden = false;
    }
  }

  // A teacher should never be shown a Postgres or PostgREST message. The worst
  // one names internal function signatures -- "Could not find the function
  // public.rma_teacher_leaderboard(p_grade, p_limit, p_section, p_token) in the
  // schema cache" -- which says nothing useful to a teacher and describes a
  // deployment step only the department can perform. The raw text still goes to
  // the console, because it is the only clue when a paste is half applied.
  const FRIENDLY_ERRORS = [
    { test: /schema cache|PGRST202|Could not find the function|does not exist/i,
      message: "This report is not available yet. The database setup needs to be finished before it can load." },
    { test: /expired|invalid session|session required|not authenticated/i,
      message: "Your session has expired. Please sign in again." },
    { test: /failed to fetch|networkerror|load failed/i,
      message: "Could not reach the server. Check your connection and try again." },
  ];

  function friendlyError(error, fallback) {
    const raw = String((error && error.message) || "");
    if (raw) console.warn("[rma] leaderboard request failed:", raw);
    const hit = FRIENDLY_ERRORS.find((f) => f.test.test(raw));
    return hit ? hit.message : fallback;
  }

  // An expired session has to tear the portal down, not just relabel the error,
  // otherwise every other panel fails the same way behind a stale token.
  function endSessionIfExpired(error) {
    if (!/expired|invalid session|session required/i.test(String((error && error.message) || ""))) return false;
    token = "";
    rows = [];
    sessionStorage.removeItem("rma_teacher_token");
    dashboard.hidden = true;
    loginCard.hidden = false;
    return true;
  }

  async function loadLeaderboards() {
    const live = document.getElementById("liveLeaderboard");
    const allTime = document.getElementById("allTimeLeaderboard");
    if (!live || !allTime) return;
    live.innerHTML = `<p class="report-note">Loading…</p>`;
    allTime.innerHTML = `<p class="report-note">Loading…</p>`;
    try {
      const data = await rpc("rma_teacher_leaderboard", {
        p_token: token,
        p_grade: currentGrade || null,
        p_section: currentSection || null,
        p_limit: 10,
      });
      renderLeaderboards(data);
    } catch (error) {
      if (endSessionIfExpired(error)) return;
      const message = friendlyError(error, "The leaderboard could not be loaded. Try again in a moment.");
      live.innerHTML = `<p class="report-note">${escapeHtml(message)}</p>`;
      allTime.innerHTML = `<p class="report-note">${escapeHtml(message)}</p>`;
      const note = document.getElementById("leaderboardNote");
      if (note) { note.textContent = ""; note.hidden = true; }
    }
  }

  function renderDashboardOverview() {
    if (!currentGrade) {
      document.getElementById("reportCard").hidden = true;
      return;
    }
    
    const stats = getCompletionStats(rows, currentGrade, currentSection);
    const levels = getLevelDistribution(rows, currentGrade, currentSection);
    const priorityLearners = getPriorityLearners(rows, currentGrade, currentSection);
    const scopedLearners = getScopedLearners(rows, currentGrade, currentSection);
    const actionNeedsHelp = document.getElementById("actionNeedsHelp");
    const actionIncomplete = document.getElementById("actionIncomplete");
    const actionCompletion = document.getElementById("actionCompletion");
    if (actionNeedsHelp) actionNeedsHelp.textContent = priorityLearners.length;
    if (actionIncomplete) actionIncomplete.textContent = stats.incomplete;
    if (actionCompletion) actionCompletion.textContent = `${stats.completionRate}%`;
    
    document.getElementById("summary").innerHTML = `
      <div class="metric">
        <b>${stats.total}</b>
        <span>Total Students</span>
      </div>
      <div class="metric">
        <b>${stats.completed}</b>
        <span>✅ Completed</span>
      </div>
      <div class="metric">
        <b>${stats.incomplete}</b>
        <span>⚠️ Incomplete</span>
      </div>
      <div class="metric">
        <b>${stats.notTaken}</b>
        <span>⏳ Not Yet Taken</span>
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
                  <span class="level-icon" style="color: ${escapeHtml(band.color)}">${escapeHtml(band.icon)}</span>
                  <span>${escapeHtml(band.label)}: <strong>${count}</strong></span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="highlight">
          <span>🎯 Priority Learners</span>
          <strong>${priorityLearners.length} need support</strong>
          <small>Filter by band in the “Who Needs Help?” card</small>
        </div>
      `;
    }
    
    const sections = unique(
      rows.filter(r => Number(r.grade) === currentGrade && (!currentSection || r.section === currentSection))
        .map(row => row.section)
    ).sort((a, b) => a.localeCompare(b));

    const scoreRows = rows.filter(row => Number(row.grade) === currentGrade
      && (!currentSection || row.section === currentSection)
      && row.score !== null && row.score !== undefined && row.is_complete !== false
      && Number.isFinite(Number(row.score)));
    const scoreChart = document.getElementById("scoreChart");
    if (scoreChart) {
      scoreChart.innerHTML = sections.length ? `<div class="section-score-chart">${sections.map(section => {
        const scores = scoreRows.filter(row => row.section === section).map(row => Number(row.score));
        if (!scores.length) {
          return `<div class="section-score-row section-score-empty"><span class="section-score-name">${escapeHtml(section)}</span><span class="section-score-count">No completed scores</span></div>`;
        }
        const average = scores.reduce((total, score) => total + score, 0) / scores.length;
        const shownAverage = Math.round(average * 10) / 10;
        const barWidth = Math.max(0, Math.min(100, average));
        const learnerLabel = scores.length === 1 ? "learner" : "learners";
        return `<div class="section-score-row">
          <span class="section-score-name">${escapeHtml(section)}</span>
          <div class="section-score-track" role="progressbar" aria-label="${escapeHtml(section)} average mastery" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${shownAverage}"><span style="width:${barWidth}%"></span></div>
          <strong class="section-score-value">${shownAverage}%</strong>
          <small class="section-score-count">${scores.length} ${learnerLabel} with completed scores</small>
        </div>`;
      }).join("")}</div>` : '<p class="report-note">No sections in this grade yet.</p>';
    }
    
    const compactQuestions = (items) => {
      const labels = items.map((item) => item.question);
      return labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ");
    };
    document.getElementById("sectionExtremes").innerHTML = sections.map((section) => {
      const sectionRows = rows.filter(row => 
        Number(row.grade) === currentGrade && row.section === section && (!currentSection || row.section === currentSection)
      );
      const range = extremes(sectionRows);
      const least = range ? range.least.map((item) => item.question) : [];
      const most = range ? range.most.map((item) => item.question) : [];
      return `<tr>
        <td>${escapeHtml(section)}</td>
        <td class="compact-question-list" title="${escapeHtml(least.join(", ") || "No item data")}">${escapeHtml(least.length ? compactQuestions(range.least) : "—")}</td>
        <td>${range ? `${range.least[0].rate}%` : "—"}</td>
        <td class="compact-question-list" title="${escapeHtml(most.join(", ") || "No item data")}">${escapeHtml(most.length ? compactQuestions(range.most) : "—")}</td>
        <td>${range ? `${range.most[0].rate}%` : "—"}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="5">No registered sections yet.</td></tr>';
    
    const allMembers = rows.filter(row => Number(row.grade) === currentGrade && (!currentSection || row.section === currentSection));
    const itemStats = questionStats(allMembers);
    document.getElementById("masteryRows").innerHTML = itemStats.length ? itemStats.map((item) =>
      `<tr>
        <td>${escapeHtml(item.question)}</td>
        <td>${item.correct}</td>
        <td>${item.count}</td>
        <td><div class="bar" aria-label="${item.rate}% mastery"><i style="width:${item.rate}%;background:${getBandColorForRate(item.rate)}"></i></div></td>
        <td><b>${item.rate}%</b></td>
      </tr>`
    ).join("") : '<tr><td colspan="5">No item-level results have been submitted for this report scope.</td></tr>';
    
    // Score is overall mastery. When the learner spent XP on help, unaided mastery is
    // the share answered correctly with no help, so intervention can target real gaps.
    const unaidedNote = (row) => {
      if (row.unaided_score === null || row.unaided_score === undefined) return "";
      const used = row.help_data ? String(row.help_data).split("|").filter(Boolean).length : 0;
      return `<span class="unaided">${Number(row.unaided_score)}% unaided${used ? ` · help on ${used}` : ""}</span>`;
    };

    document.getElementById("studentRows").innerHTML = allMembers.map((row) => {
      const state = statusFor(row.score, row.attempt_number, row.is_complete);
      const score = row.score === null || row.score === undefined ? "—" : `${Number(row.score)}%`;
      const attempt = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
      return `<tr>
        <td>${escapeHtml(row.student_code)}</td>
        <td>${escapeHtml(row.student_name || `${row.last_name}, ${row.first_name}`)}</td>
        <td>${escapeHtml(row.teacher_name)}</td>
        <td>${score}${unaidedNote(row)}</td>
        <td><span class="status ${state.className}">${state.label}</span></td>
        <td>${escapeHtml(attempt)}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="6">No students are registered for this report scope.</td></tr>';
    
    renderCompletionStatus(stats);
    renderPriorityPanel(priorityLearners, scopedLearners, stats, levels);
    renderRemovableStudents();
    loadLeaderboards();
  }

  // ============================================
  // REMOVE A STUDENT
  // ============================================
  //
  // Destructive and irreversible, so it is deliberately awkward: the learner is
  // picked from the grade and section already chosen above, and pressing Remove
  // only arms a second, separate Confirm. A stray first click does nothing.
  //
  // The scope check that matters is in rma_remove_student in the database. The
  // filter here is a convenience so the list matches what the teacher can see.

  function removeMessage(text, isError) {
    const node = document.getElementById("removeMessage");
    if (!node) return;
    node.className = isError ? "remove-confirm" : "report-note";
    node.textContent = text;
  }

  // The card carries its own grade and section picks rather than borrowing the
  // dashboard's. Removing somebody is a different decision from reading a report,
  // and sharing one control meant the scope could silently change under the
  // teacher's hands while they were picking a name.
  let removeGrade = null;
  let removeSection = "";

  function renderRemoveFilters() {
    const gradeSelect = document.getElementById("removeGradeFilter");
    const sectionSelect = document.getElementById("removeSectionFilter");
    if (!gradeSelect || !sectionSelect) return;

    const grades = unique(rows.map((row) => Number(row.grade)).filter(Boolean)).sort((a, b) => a - b);
    gradeSelect.innerHTML = '<option value="">Choose a grade level</option>'
      + grades.map((g) => `<option value="${g}"${g === removeGrade ? " selected" : ""}>Grade ${g}</option>`).join("");

    if (!removeGrade) {
      sectionSelect.innerHTML = '<option value="">Select a grade first</option>';
      sectionSelect.disabled = true;
      return;
    }

    const sections = unique(rows.filter((row) => Number(row.grade) === removeGrade).map((row) => row.section))
      .sort((a, b) => String(a).localeCompare(String(b)));
    sectionSelect.disabled = sections.length === 0;
    if (!sections.includes(removeSection)) removeSection = "";
    sectionSelect.innerHTML = '<option value="">' + (sections.length ? "All sections" : "No sections") + '</option>'
      + sections.map((s) => `<option value="${escapeHtml(s)}"${s === removeSection ? " selected" : ""}>${escapeHtml(s)}</option>`).join("");
  }

  function renderRemovableStudents() {
    const list = document.getElementById("removableList");
    if (!list) return;

    renderRemoveFilters();

    if (!removeGrade) {
      list.innerHTML = '<li class="remove-empty">Choose a grade level to begin.</li>';
      return;
    }
    if (!removeSection && !document.getElementById("removeSectionFilter").disabled) {
      // "All sections" is a real choice, so an empty value means all of them.
      removeSection = "";
    }

    // Who is in this selection at all. Split from who can be removed, because the
    // two can differ: rma_remove_student needs the student id, and a row with no
    // id cannot be named even though the learner plainly exists.
    const inScope = rows
      .filter((row) => Number(row.grade) === removeGrade
        && (!removeSection || String(row.section) === String(removeSection)));
    const candidates = inScope
      .filter((row) => row.student_id)
      .sort((a, b) => String(a.student_name || "").localeCompare(String(b.student_name || "")));

    if (!inScope.length) {
      list.innerHTML = '<li class="remove-empty">There is nobody to remove in this selection.</li>';
      return;
    }

    if (!candidates.length) {
      // Say what is actually wrong. Saying "nobody to remove" when the section is
      // full of learners is misleading, and it hid an older rma_teacher_dashboard
      // on the database that does not return a student id at all.
      list.innerHTML = `<li class="remove-empty">There ${inScope.length === 1 ? "is 1 learner" : `are ${inScope.length} learners`} `
        + `in this selection, but this database did not send a student id for them, so they cannot be removed here. `
        + `Re-paste supabase/schema.sql in the Supabase SQL editor and reload, or run supabase/add-remove-student.sql.</li>`;
      return;
    }

    const where = removeSection ? `Grade ${removeGrade} · ${removeSection}` : `Grade ${removeGrade} · all sections`;
    list.innerHTML = `<li class="remove-scope">${escapeHtml(where)} — ${candidates.length} learner${candidates.length === 1 ? "" : "s"} can be removed</li>`
      + candidates.map((row) => `
      <li class="remove-row">
        <span class="remove-who">
          <b>${escapeHtml(row.student_name || "")}</b>
          <span>${escapeHtml(row.student_code || "")} · ${escapeHtml(row.section || "")} · ${escapeHtml(row.teacher_name || "")}</span>
        </span>
        <button type="button" class="btn-danger-ghost" data-remove-student="${escapeHtml(row.student_id)}">Remove</button>
      </li>`).join("");
  }

  document.getElementById("removeGradeFilter")?.addEventListener("change", (event) => {
    removeGrade = event.target.value ? Number(event.target.value) : null;
    removeSection = "";
    removeMessage("", false);
    renderRemovableStudents();
  });

  document.getElementById("removeSectionFilter")?.addEventListener("change", (event) => {
    removeSection = event.target.value;
    removeMessage("", false);
    renderRemovableStudents();
  });

  // Arms a confirm, or performs the removal when the confirm is already armed.
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-remove-student]");
    if (!button) return;

    const id = button.dataset.removeStudent;

    if (button.dataset.armed !== "1") {
      const row = rows.find((r) => r.student_id === id);
      const name = row ? (row.student_name || row.student_code) : "this learner";
      button.dataset.armed = "1";
      button.textContent = "Confirm delete";
      removeMessage(`Press Confirm delete to remove ${name}, their attempts and their sessions. This cannot be undone.`, true);
      // Disarm if they click anywhere else, so a later stray click cannot fire it.
      setTimeout(() => {
        if (!document.body.contains(button)) return;
        button.dataset.armed = "0";
        button.textContent = "Remove";
      }, 8000);
      return;
    }

    const row = rows.find((r) => r.student_id === id);
    const name = row ? (row.student_name || row.student_code) : "this learner";
    button.disabled = true;
    button.textContent = "Removing…";
    removeMessage(`Removing ${name}…`, false);

    try {
      const result = await rpc("rma_remove_student", { p_token: token, p_student_id: id });
      const removed = (result && result.student_name) || name;
      removeMessage(
        `Removed ${removed} along with ${Number(result.scores_deleted) || 0} attempt(s), `
        + `${Number(result.violations_deleted) || 0} violation record(s) and `
        + `${Number(result.sessions_deleted) || 0} session(s).`, false);
      await loadDashboard();
    } catch (error) {
      button.disabled = false;
      button.dataset.armed = "0";
      button.textContent = "Remove";
      // The function arrives with add-remove-student.sql; until then this is the
      // message a teacher will see, so it says what to do rather than leaking
      // a PostgREST error.
      const raw = String((error && error.message) || "");
      if (/PGRST202|schema cache|does not exist/i.test(raw)) {
        removeMessage("Removing a learner is not set up on this database yet. Run supabase/add-remove-student.sql once, then reload.", true);
      } else {
        removeMessage(friendlyError(error, "That learner could not be removed. Try again."), true);
      }
    }
  });

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

  // ============================================
  // LEARNING GAPS
  // Turns a learner's item-level answers into "Needs support in: Fractions"
  // by matching their missed local question numbers to the master map topics.
  // ============================================

  let mmTopicIndex = null;

  function mmTopicLookup(grade) {
    if (!mmTopicIndex) {
      mmTopicIndex = {};
      const map = window.RMA_MASTER_MAP;
      if (map && Array.isArray(map.questions)) {
        map.questions.forEach((q) => {
          if (q.type !== "RMA Original" || !q.topic) return;
          const byId = mmTopicIndex[q.g] || (mmTopicIndex[q.g] = {});
          byId[q.id] = { topic: q.topic, item: q.item, cog: q.cog };
        });
      }
    }
    return mmTopicIndex[grade] || {};
  }

  function getWeakTopics(row, limit = 4) {
    const lookup = mmTopicLookup(Number(row.grade));
    const answers = String(row.rma_data || "").split("|");
    if (!answers.length || !Object.keys(lookup).length) return [];

    const buckets = new Map();
    answers.forEach((answer, index) => {
      if (answer !== "0" && answer !== "1") return;
      const meta = lookup[index + 1];
      if (!meta) return;
      const bucket = buckets.get(meta.topic) || { topic: meta.topic, missed: 0, seen: 0, items: [], cog: meta.cog };
      bucket.seen += 1;
      if (answer === "0") { bucket.missed += 1; bucket.items.push(meta.item); }
      buckets.set(meta.topic, bucket);
    });

    return [...buckets.values()]
      .filter((b) => b.missed > 0)
      .sort((a, b) => b.missed - a.missed || (a.seen - a.missed) / a.seen - (b.seen - b.missed) / b.seen)
      .slice(0, limit)
      .map((b) => ({ ...b, rate: Math.round(((b.seen - b.missed) / b.seen) * 100) }));
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

  function renderDashboardFreshness() {
    const node = document.getElementById("dashboardFreshness");
    if (!node || !lastDashboardRefresh) return;
    const elapsedMinutes = Math.floor((Date.now() - lastDashboardRefresh) / 60000);
    node.textContent = elapsedMinutes < 1 ? "Updated just now" : `Last refreshed ${elapsedMinutes}m ago`;
    node.title = `Last refreshed ${new Date(lastDashboardRefresh).toLocaleString()}`;
  }

  async function loadRemovalHistory() {
    const list = document.getElementById("removalHistoryList");
    if (!list) return;
    try {
      const history = await rpc("rma_teacher_removal_history", { p_token: token, p_limit: 10 });
      list.innerHTML = history.length ? history.map((entry) => {
        const counts = `${Number(entry.scores_deleted) || 0} attempts, ${Number(entry.violations_deleted) || 0} violations`;
        return `<li>${escapeHtml(new Date(entry.removed_at).toLocaleString())} · Grade ${escapeHtml(entry.grade)} / ${escapeHtml(entry.section)} · ${escapeHtml(counts)}</li>`;
      }).join("") : '<li class="removal-history-empty">No removals recorded.</li>';
    } catch (error) {
      const text = /PGRST202|schema cache|does not exist/i.test(String(error.message || ""))
        ? "Run supabase/add-remove-student.sql to enable history."
        : "Removal history is temporarily unavailable.";
      list.innerHTML = `<li class="removal-history-empty">${escapeHtml(text)}</li>`;
    }
  }

  async function loadDashboard(options = {}) {
    const previousGrade = options.preserveSelection ? currentGrade : null;
    const previousSection = options.preserveSelection ? currentSection : null;
    dashboardMessage.hidden = true;
    try {
      await loadScoreBands();
      await renderTeacherScope();
      
      rows = await rpc("rma_teacher_dashboard", { p_token: token });
      lastDashboardRefresh = Date.now();
      renderDashboardFreshness();
      await loadRemovalHistory();
      
      const grades = unique(rows.map((row) => String(row.grade))).sort((a, b) => Number(a) - Number(b));
      gradeFilter.innerHTML = '<option value="">Choose a grade level</option>' + 
        grades.map((grade) => `<option value="${escapeHtml(grade)}">Grade ${escapeHtml(grade)}</option>`).join("");
      sectionFilter.innerHTML = '<option value="">Select a grade first</option>';
      sectionFilter.disabled = true;
      document.getElementById("reportCard").hidden = true;
      
      if (!rows.length) {
        setMessage(dashboardMessage, "No student accounts are registered yet.", false);
      }
      if (previousGrade && grades.includes(String(previousGrade))) {
        gradeFilter.value = String(previousGrade);
        renderSelectedReport();
        if (previousSection) {
          sectionFilter.value = previousSection;
          currentSection = previousSection;
          renderDashboardOverview();
        }
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

  // Tell the teacher which records they are allowed to see. Older databases do
  // not have rma_teacher_profile yet, so a missing function is not an error.
  async function renderTeacherScope() {
    const node = document.getElementById("teacherScopeNote");
    if (!node) return;
    try {
      const profile = await rpc("rma_teacher_profile", { p_token: token });
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
      const scoped = !profile.see_all_sections && name;
      node.textContent = scoped
        ? `Showing only the classes assigned to ${name}.`
        : "Showing every registered section. A head teacher can restrict an account to its own classes by setting its name and clearing 'see all sections'.";
      node.className = scoped ? "report-note scope-scoped" : "report-note scope-all";
    } catch (error) {
      node.textContent = "";
      node.hidden = true;
    }
  }

  // Teacher-recorded observation: mark the learner's latest attempt finished or
  // unfinished. The student pages never write is_complete, so without this the
  // Incomplete state could never appear.
  async function setAttemptComplete(studentCode, isComplete) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("rma_set_attempt_complete", {
        p_token: token,
        p_student_code: studentCode,
        p_complete: isComplete
      });
      rows = await rpc("rma_teacher_dashboard", { p_token: token });
      renderDashboardOverview();
    } catch (error) {
      setMessage(dashboardMessage, error.message || "Could not update that attempt.");
    } finally {
      state.busy = false;
    }
  }

  // ============================================
  // CLASS RECORDS EXPORT (suggestion 14)
  // SpreadsheetML rather than CSV so Excel opens the level and status
  // columns as real values instead of raw text. No external library.
  // ============================================

  const EXPORT_COLUMNS = [
    { header: "Student ID", key: "student_code" },
    { header: "Name", key: "student_name" },
    { header: "Grade", key: "grade" },
    { header: "Section", key: "section" },
    { header: "Score", key: "score" },
    { header: "Percentage", key: "percentage" },
    { header: "Level", key: "level" },
    { header: "Status", key: "status" },
    { header: "Attempts", key: "attempts" },
    { header: "Last Assessment", key: "date" },
    { header: "Unaided Score", key: "unaided" },
    { header: "Questions With Help", key: "help" }
  ];

  function exportRows() {
    return rows
      .filter((row) => Number(row.grade) === currentGrade && (!currentSection || row.section === currentSection))
      .sort((a, b) => String(a.section).localeCompare(String(b.section)) || String(a.student_name).localeCompare(String(b.student_name)))
      .map((row) => {
        const status = statusFor(row.score, row.attempt_number, row.is_complete);
        return [
          row.student_code || "",
          row.student_name || "",
          row.grade,
          row.section || "",
          row.score === null || row.score === undefined ? "" : row.score,
          row.score === null || row.score === undefined ? "" : `${row.score}%`,
          status.band ? status.band.label : "",
          status.label,
          row.attempts === undefined || row.attempts === null ? (row.attempt_number || "") : row.attempts,
          row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
          row.unaided_score === null || row.unaided_score === undefined ? "" : Number(row.unaided_score),
          row.help_data ? String(row.help_data).split("|").filter(Boolean).length : (row.unaided_score === null || row.unaided_score === undefined ? "" : 0)
        ];
      });
  }

  function xmlEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
  }

  // Section names come from student-entered data, so keep them safe for a filename.
  function sanitizeFilenamePart(value) {
    return String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 40) || "Section";
  }

  function downloadFile(filename, mime, content) {
    const blob = new Blob(["\ufeff", content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function visibleInterventionLearners() {
    return priorityCache.scoped.filter((learner) => priorityMatchesBand(learner, priorityBandFilter));
  }

  function exportInterventionGroup() {
    if (!currentGrade) { setMessage(dashboardMessage, "Choose a grade level first."); return; }
    const visible = visibleInterventionLearners();
    if (!visible.length) { setMessage(dashboardMessage, "There are no learners in this intervention group."); return; }
    const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [["Student ID", "Name", "Section", "Score", "Status", interventionReady ? "Top missed skill" : "Needs support in"].map(quote).join(",")];
    visible.forEach((learner) => lines.push([
      learner.student_code, learner.student_name, learner.section,
      learner.score ?? "", learner.status.label,
      interventionReady ? ((learner.weakTopics || [])[0] || {}).topic || "No item data" : (learner.weakTopics || []).map((topic) => topic.topic).join("; ")
    ].map(quote).join(",")));
    const group = sanitizeFilenamePart(priorityBandFilter || "all");
    downloadFile(`RMA-Intervention-Grade${currentGrade}-${group}.csv`, "text/csv;charset=utf-8", lines.join("\r\n"));
    setMessage(dashboardMessage, `Exported ${visible.length} learner${visible.length === 1 ? "" : "s"} in this intervention group.`, false);
  }

  function printInterventionGroup() {
    const visible = visibleInterventionLearners();
    if (!visible.length) { setMessage(dashboardMessage, "There are no learners in this intervention group."); return; }
    const rowsHtml = visible.map((learner) => {
      const top = (learner.weakTopics || [])[0];
      return `<tr><td>${escapeHtml(learner.student_code)}</td><td>${escapeHtml(learner.student_name)}</td><td>${escapeHtml(learner.section)}</td><td>${escapeHtml(top ? top.topic : "No item data")}</td><td>${escapeHtml(learner.status.label)}</td></tr>`;
    }).join("");
    const win = window.open("", "_blank");
    if (!win) { setMessage(dashboardMessage, "Allow pop-ups to print the intervention plan."); return; }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Grade ${escapeHtml(currentGrade)} intervention plan</title><style>body{font:12px/1.4 Arial,sans-serif;color:#222;margin:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #aaa;text-align:left}th{background:#eee}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print</button><h1>Grade ${escapeHtml(currentGrade)} intervention plan</h1><p>${visible.length} learners · Top missed skill by latest attempt · ${new Date().toLocaleDateString()}</p><table><thead><tr><th>ID</th><th>Learner</th><th>Section</th><th>Top missed skill</th><th>Status</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
  }

  function jumpToPanel(id, filter) {
    if (filter) setPriorityBandFilter(filter);
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusLearner(studentCode) {
    const row = [...document.querySelectorAll("#studentRows tr")]
      .find((item) => item.dataset.studentCode === studentCode);
    document.querySelectorAll("#studentRows tr.focused-learner").forEach((item) => item.classList.remove("focused-learner"));
    if (!row) return;
    row.classList.add("focused-learner");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function arrangeActionFirstOverview() {
    const overview = document.getElementById("tabOverviewContent");
    const actionCenter = document.getElementById("actionCenter");
    const priority = document.getElementById("priorityLearnersCard");
    const completion = document.getElementById("completionStatusCard");
    const trends = document.getElementById("classTrends");
    if (!overview || !actionCenter || !trends) return;
    overview.insertBefore(priority, trends);
    overview.insertBefore(completion, trends);
  }

  function exportClassRecords() {
    if (!currentGrade) { setMessage(dashboardMessage, "Choose a grade level first."); return; }
    const data = exportRows();
    if (!data.length) { setMessage(dashboardMessage, "No learners in this scope to export."); return; }

    const header = EXPORT_COLUMNS.map((c) => `<Cell><Data ss:Type="String">${xmlEscape(c.header)}</Data></Cell>`).join("");
    const body = data.map((cells) => `<Row>${cells.map((v) =>
      `<Cell><Data ss:Type="${typeof v === "number" ? "Number" : "String"}">${xmlEscape(v)}</Data></Cell>`).join("")}</Row>`).join("");

    const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Class Records">
    <Table>
      <Row>${header}</Row>
      ${body}
    </Table>
  </Worksheet>
</Workbook>`;

    const scope = currentSection ? `Grade${currentGrade}-${sanitizeFilenamePart(currentSection)}` : `Grade${currentGrade}-AllSections`;
    downloadFile(`RMA-Pathways-${scope}.xls`, "application/vnd.ms-excel;charset=utf-8", xml);
    setMessage(dashboardMessage, `Exported ${data.length} learner record${data.length === 1 ? "" : "s"} for ${scope.replace(/-/g, " ")}.`, false);
  }

  // ============================================
  // PRINTABLE CLASS PROGRESS REPORT (suggestion 13)
  // ============================================

  function printClassReport() {
    if (!currentGrade) { setMessage(dashboardMessage, "Choose a grade level first."); return; }
    const data = exportRows();
    if (!data.length) { setMessage(dashboardMessage, "No learners in this scope to print."); return; }

    const levels = getLevelDistribution(rows, currentGrade, currentSection);
    const stats = getCompletionStats(rows, currentGrade, currentSection);
    const scope = currentSection ? `Grade ${currentGrade} - ${currentSection}` : `Grade ${currentGrade} - All Sections`;

    const body = data.map((cells, i) => `
      <tr>
        <td>${i + 1}</td><td>${xmlEscape(cells[0])}</td><td>${xmlEscape(cells[1])}</td>
        <td class="num">${xmlEscape(cells[4])}</td>
        <td>${xmlEscape(cells[6] || cells[7])}</td>
        <td>${xmlEscape(cells[7])}</td>
        <td>${xmlEscape(cells[9])}</td>
      </tr>`).join("");

    const band = (name) => (scoreBands.find((b) => b.band_name === name) || {}).label || name;
    const bandRows = scoreBands.map((b) =>
      `<span class="pill">${xmlEscape(b.icon || "")} ${xmlEscape(band(b.band_name))}: <b>${(levels && levels[b.band_name]) || 0}</b></span>`
    ).join("");

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>RMA Pathways Class Progress Report - ${xmlEscape(scope)}</title>
<style>
  @page { margin: 16mm 14mm; }
  body { font: 12px/1.5 "Times New Roman", Georgia, serif; color:#111; }
  h1 { font-size: 17px; margin: 0 0 2px; letter-spacing: .04em; }
  .sub { font-size: 11px; color:#333; margin-bottom: 10px; }
  .fields { display:grid; grid-template-columns: 1fr 1fr; gap: 8px 22px; margin: 0 0 14px; }
  .fields div { display:flex; gap:6px; align-items:baseline; font-size: 12px; }
  .fields span { font-weight: 700; white-space:nowrap; }
  .fields i { flex:1; border-bottom: 1px solid #333; font-style:normal; }
  .pills { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; font-size:11px; }
  .pill { border:1px solid #999; border-radius:999px; padding:2px 9px; }
  .meta { font-size:11px; color:#333; margin-bottom:8px; }
  table { width:100%; border-collapse: collapse; font-size: 11px; }
  th, td { border:1px solid #444; padding: 4px 6px; text-align:left; }
  th { background:#eee; }
  td.num { text-align:right; font-variant-numeric: tabular-nums; }
  tfoot td { font-weight:700; background:#f6f6f6; }
  footer { margin-top: 14px; font-size: 10px; color:#444; }
  @media print { .no-print { display:none; } }
</style></head><body>
<div class="no-print" style="margin-bottom:12px;">
  <button onclick="window.print()">Print</button>
  <button onclick="window.close()">Close</button>
</div>
<div class="sub">REPUBLIC OF THE PHILIPPINES<br>DEPARTMENT OF EDUCATION</div>
<h1>RMA PATHWAYS &mdash; CLASS PROGRESS REPORT</h1>
<div class="fields">
  <div><span>School:</span><i></i></div>
  <div><span>Teacher:</span><i></i></div>
  <div><span>Grade &amp; Section:</span><i>${xmlEscape(scope)}</i></div>
  <div><span>School Year:</span><i></i></div>
</div>
<div class="pills">${bandRows}
  <span class="pill">⚠️ Incomplete: <b>${stats.incomplete}</b></span>
  <span class="pill">⏳ Not yet taken: <b>${stats.notTaken}</b></span>
</div>
<div class="meta">${stats.total} learners &middot; ${stats.completed} completed (${stats.completionRate}%) &middot; generated ${new Date().toLocaleString()}</div>
<table>
  <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Score</th><th>Level</th><th>Status</th><th>Assessment Date</th></tr></thead>
  <tbody>${body}</tbody>
  <tfoot><tr><td colspan="3">Learners in scope</td><td class="num">${stats.total}</td><td colspan="3">Completion ${stats.completionRate}%</td></tr></tfoot>
</table>
<footer>Teacher records export. Contains protected learner information &mdash; handle and store in line with school data-protection policy.</footer>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) { setMessage(dashboardMessage, "Allow pop-ups for this site to open the printable report."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { try { win.print(); } catch (error) { /* user prints manually */ } }, 350);
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  // Reveal a teacher password so it can be checked before submitting. Delegated on
  // the document because the card is shown and hidden rather than rebuilt, and a
  // bound listener on a hidden node would still work but ties the handler to one
// element. Masking is restored on sign-in so the field is never left revealed.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle-password]");
    if (!button) return;
    // The button sits inside a <label>, so stop the label claiming the click too.
    event.preventDefault();
    const input = document.getElementById(button.dataset.togglePassword);
    if (!input) return;
    const revealed = input.type === "password";
    input.type = revealed ? "text" : "password";
    button.setAttribute("aria-pressed", String(revealed));
    button.setAttribute("aria-label", revealed ? "Hide password" : "Show password");
    input.focus({ preventScroll: true });
  });

  function maskTeacherPasswords() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (input) input.type = "password";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Show password");
    });
  }

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
      maskTeacherPasswords();
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
    priorityBandFilter = NEEDS_HELP;
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
    document.getElementById("reportCard").hidden = false;
    renderDashboardOverview();
  });

  sectionFilter.addEventListener("change", () => {
    currentSection = sectionFilter.value === "*" ? null : sectionFilter.value;
    priorityBandFilter = NEEDS_HELP;
    renderDashboardOverview();
  });

  document.getElementById("exportClassRecords").addEventListener("click", exportClassRecords);
  document.getElementById("printClassReport").addEventListener("click", printClassReport);
  document.getElementById("refreshDashboard").addEventListener("click", () => loadDashboard({ preserveSelection: true }));
  document.getElementById("interventionPreset").addEventListener("click", setInterventionReady);

  document.getElementById("priorityFilterContainer").addEventListener("click", (event) => {
    const chip = event.target.closest(".band-chip");
    if (chip) setPriorityBandFilter(chip.dataset.band);
  });
  setInterval(renderDashboardFreshness, 30000);

  document.getElementById("teacherLogout").addEventListener("click", () => {
    sessionStorage.removeItem("rma_teacher_token"); token = ""; rows = [];
    currentGrade = null; currentSection = null;
    document.getElementById("reportCard").hidden = true;
    dashboard.hidden = true; loginCard.hidden = false;
  });

  // Expose for debugging
  window._QUESTION_BANK = QUESTION_BANK;
  window._BANK_QUESTIONS = BANK_QUESTIONS;
  window._RMA_MASTER_MAP = window.RMA_MASTER_MAP;

  // Inline onclick handlers in teacher.html need these on the global scope.
  window.showTab = showTab;
  window.filterQuestions = filterQuestions;
  window.toggleAlignedQuestions = toggleAlignedQuestions;
  window.toggleFeedback = toggleFeedback;
  window.renderMasterMap = renderMasterMap;
  window.resetMasterMapFilters = resetMasterMapFilters;
  window.setPriorityBandFilter = setPriorityBandFilter;
  window.setAttemptComplete = setAttemptComplete;
  window.exportClassRecords = exportClassRecords;
  window.printClassReport = printClassReport;
  window.exportInterventionGroup = exportInterventionGroup;
  window.printInterventionGroup = printInterventionGroup;
  window.jumpToPanel = jumpToPanel;
  window.focusLearner = focusLearner;
  arrangeActionFirstOverview();
  
  // Do not silently reuse a stored teacher token: shared devices require a fresh sign-in.
})();
