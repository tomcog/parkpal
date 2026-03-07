export interface NationalPark {
  id: string;
  name: string;
  state: string;
  established: string;
  description: string;
  imageQuery: string;
  lat: number;
  lng: number;
  facts: string[];
  trivia: string[];
}

export const nationalParks: NationalPark[] = [
  {
    id: "acadia",
    name: "Acadia National Park",
    state: "Maine",
    established: "1919",
    description: "Acadia encompasses mountains, ocean shoreline, forests, and lakes on the rugged coast of Maine, offering stunning views from Cadillac Mountain.",
    imageQuery: "acadia national park",
    lat: 44.35,
    lng: -68.21,
    facts: [
      "Covers 49,075 acres on Mount Desert Island and surrounding smaller islands",
      "Cadillac Mountain is the highest point on the U.S. Atlantic coast at 1,530 feet",
      "Originally named Lafayette National Park when established in 1919"
    ],
    trivia: [
      "First national park east of the Mississippi River",
      "One of the first places in the U.S. to see the sunrise each day (from October to March)",
      "Home to 26 species of land mammals including moose, black bears, and coyotes"
    ]
  },
  {
    id: "american-samoa",
    name: "National Park of American Samoa",
    state: "American Samoa",
    established: "1988",
    description: "This park preserves tropical rainforests, coral reefs, and Samoan culture on three volcanic islands in the South Pacific.",
    imageQuery: "american samoa tropical beach",
    lat: -14.25,
    lng: -170.68,
    facts: [
      "Only U.S. national park south of the equator",
      "Covers 13,500 acres across three islands: Tutuila, Ofu, and Ta'ū",
      "Park lands are leased from Samoan villages, not federally owned"
    ],
    trivia: [
      "Home to the only paleotropical rainforest in the National Park System",
      "Over 950 species of fish and 250 species of coral found in park waters",
      "Flying foxes (fruit bats) are a crucial part of the ecosystem"
    ]
  },
  {
    id: "arches",
    name: "Arches National Park",
    state: "Utah",
    established: "1971",
    description: "Arches preserves over 2,000 natural sandstone arches, including the iconic Delicate Arch, along with balanced rocks, fins, and pinnacles.",
    imageQuery: "arches national park utah",
    lat: 38.68,
    lng: -109.57,
    facts: [
      "Contains over 2,000 natural stone arches, the densest concentration in the world",
      "Delicate Arch stands 46 feet high and 32 feet wide",
      "Located on a salt bed thousands of feet thick, which contributes to arch formation"
    ],
    trivia: [
      "Landscape Arch is the longest natural arch in North America at 290 feet",
      "The park's sandstone is approximately 65-300 million years old",
      "Featured on Utah's license plate and quarter"
    ]
  },
  {
    id: "badlands",
    name: "Badlands National Park",
    state: "South Dakota",
    established: "1978",
    description: "Badlands features dramatically eroded buttes, pinnacles, and spires, along with the largest undisturbed mixed grass prairie in the United States.",
    imageQuery: "badlands south dakota",
    lat: 43.75,
    lng: -102.50,
    facts: [
      "Contains one of the world's richest fossil beds from 23-35 million years ago",
      "Preserves the largest protected mixed grass prairie in the United States",
      "Rock formations erode at a rate of about one inch per year"
    ],
    trivia: [
      "Ancient horses, rhinoceroses, and saber-toothed cats once roamed this area",
      "Black-footed ferrets, one of North America's most endangered mammals, were reintroduced here",
      "The Lakota people named it 'Mako Sica' meaning 'bad lands'"
    ]
  },
  {
    id: "big-bend",
    name: "Big Bend National Park",
    state: "Texas",
    established: "1944",
    description: "Big Bend encompasses the Chihuahuan Desert and the Chisos Mountains, with the Rio Grande forming a dramatic boundary along Mexico.",
    imageQuery: "big bend texas desert",
    lat: 29.25,
    lng: -103.25,
    facts: [
      "Covers 801,163 acres, making it one of the largest national parks",
      "Named for the big bend in the Rio Grande River along the U.S.-Mexico border",
      "Encompasses the entire Chisos Mountain range"
    ],
    trivia: [
      "One of the least visited national parks, offering exceptional solitude",
      "Has more species of birds (450) than any other U.S. national park",
      "One of the few places in the U.S. where day and night temperatures can vary by 40°F"
    ]
  },
  {
    id: "biscayne",
    name: "Biscayne National Park",
    state: "Florida",
    established: "1980",
    description: "Biscayne protects a rare combination of aquamarine waters, emerald islands, and fish-bejeweled coral reefs near Miami.",
    imageQuery: "biscayne bay coral reef",
    lat: 25.65,
    lng: -80.08,
    facts: [
      "95% of the park is water, making it primarily an underwater park",
      "Protects a portion of the third-largest coral reef in the world",
      "Covers 172,971 acres of reefs, bay, and islands"
    ],
    trivia: [
      "Home to several historic shipwrecks, including the 1878 wreck of the Arratoon Apcar",
      "Manatees frequent the park's warm waters in winter",
      "Only accessible by boat, making it one of the least visited parks"
    ]
  },
  {
    id: "black-canyon",
    name: "Black Canyon of the Gunnison National Park",
    state: "Colorado",
    established: "1999",
    description: "Black Canyon features some of the steepest cliffs, oldest rock, and craggiest spires in North America, carved by the Gunnison River.",
    imageQuery: "black canyon gunnison",
    lat: 38.57,
    lng: -107.72,
    facts: [
      "The canyon walls reach depths of 2,722 feet",
      "Rock in the canyon is nearly 2 billion years old",
      "Named for the deep shadows that create darkness even in midday"
    ],
    trivia: [
      "The Painted Wall is Colorado's tallest cliff at 2,250 feet",
      "The Gunnison River drops an average of 95 feet per mile through the canyon",
      "Only 1/2 to 1 hour of sunlight reaches the canyon floor each day"
    ]
  },
  {
    id: "bryce-canyon",
    name: "Bryce Canyon National Park",
    state: "Utah",
    established: "1928",
    description: "Bryce Canyon is famous for its unique geology of crimson-colored hoodoos - spire-shaped rock formations - creating an otherworldly landscape.",
    imageQuery: "bryce canyon hoodoos",
    lat: 37.57,
    lng: -112.18,
    facts: [
      "Contains the largest collection of hoodoos in the world",
      "Despite its name, Bryce Canyon is not actually a canyon but a collection of amphitheaters",
      "Elevations range from 6,620 to 9,115 feet"
    ],
    trivia: [
      "Named after Ebenezer Bryce, who homesteaded in the area in the 1870s",
      "Bryce reportedly described it as 'a hell of a place to lose a cow'",
      "The area experiences over 200 freeze-thaw cycles per year, which creates the hoodoos"
    ]
  },
  {
    id: "canyonlands",
    name: "Canyonlands National Park",
    state: "Utah",
    established: "1964",
    description: "Canyonlands showcases a colorful landscape carved by the Colorado and Green Rivers into countless canyons, mesas, and buttes.",
    imageQuery: "canyonlands mesa arch",
    lat: 38.20,
    lng: -109.93,
    facts: [
      "Covers 337,598 acres divided into four districts",
      "The Colorado and Green Rivers divide the park into districts",
      "Contains thousands of years of human history including rock art"
    ],
    trivia: [
      "Mesa Arch frames a perfect sunrise view",
      "The Maze district is one of the most remote areas in the continental United States",
      "Ancestral Puebloans left behind over 2,000 archaeological sites"
    ]
  },
  {
    id: "capitol-reef",
    name: "Capitol Reef National Park",
    state: "Utah",
    established: "1971",
    description: "Capitol Reef showcases a 100-mile wrinkle in the Earth's crust known as the Waterpocket Fold, with colorful canyons, ridges, and historic orchards.",
    imageQuery: "capitol reef utah",
    lat: 38.20,
    lng: -111.17,
    facts: [
      "The Waterpocket Fold extends nearly 100 miles",
      "Named 'reef' because the rock formations were a barrier to travel, like a coral reef",
      "'Capitol' comes from white Navajo Sandstone domes resembling capitol buildings"
    ],
    trivia: [
      "Historic Fruita orchards still produce fruit that visitors can pick in season",
      "Contains over 1,000 petroglyphs created by the Fremont Culture",
      "One of the least visited national parks despite its stunning scenery"
    ]
  },
  {
    id: "carlsbad-caverns",
    name: "Carlsbad Caverns National Park",
    state: "New Mexico",
    established: "1930",
    description: "Carlsbad Caverns features more than 119 caves formed when sulfuric acid dissolved limestone, creating spectacular underground chambers.",
    imageQuery: "carlsbad caverns cave",
    lat: 32.17,
    lng: -104.44,
    facts: [
      "Contains 119 known caves, the longest being Lechuguilla Cave at over 140 miles",
      "The Big Room is the largest single cave chamber by volume in North America",
      "Formed by sulfuric acid, not the usual carbonic acid process"
    ],
    trivia: [
      "Mexican free-tailed bats summer in the caves, up to 400,000 at peak season",
      "The bat flight program at sunset is one of the park's most popular attractions",
      "Temperature in the caves remains a constant 56°F year-round"
    ]
  },
  {
    id: "channel-islands",
    name: "Channel Islands National Park",
    state: "California",
    established: "1980",
    description: "Channel Islands preserves five remarkable islands and their ocean environment, with unique plants, animals, and archeological resources.",
    imageQuery: "channel islands california",
    lat: 34.01,
    lng: -119.42,
    facts: [
      "Protects five of the eight Channel Islands and surrounding ocean",
      "Contains over 2,000 plant and animal species, 145 found nowhere else",
      "Archaeological evidence shows human habitation dating back 13,000 years"
    ],
    trivia: [
      "Often called the 'Galapagos of North America' due to unique species",
      "The island fox, found nowhere else, weighs only 3-4 pounds",
      "Accessible only by boat or plane"
    ]
  },
  {
    id: "congaree",
    name: "Congaree National Park",
    state: "South Carolina",
    established: "2003",
    description: "Congaree preserves the largest intact expanse of old-growth bottomland hardwood forest remaining in North America.",
    imageQuery: "congaree forest swamp",
    lat: 33.78,
    lng: -80.78,
    facts: [
      "One of the newest national parks, established in 2003",
      "Protects 26,692 acres of old-growth bottomland hardwood forest",
      "Experiences periodic flooding that creates diverse habitats"
    ],
    trivia: [
      "Contains some of the tallest trees in the eastern United States",
      "Designated an International Biosphere Reserve",
      "Home to synchronous fireflies that flash in unison during mating season"
    ]
  },
  {
    id: "crater-lake",
    name: "Crater Lake National Park",
    state: "Oregon",
    established: "1902",
    description: "Crater Lake is the deepest lake in the US, formed in the caldera of an ancient volcano, known for its stunning deep blue color and clarity.",
    imageQuery: "crater lake oregon blue",
    lat: 42.94,
    lng: -122.11,
    facts: [
      "Deepest lake in the United States at 1,943 feet",
      "Formed 7,700 years ago when Mount Mazama collapsed",
      "Filled almost entirely by rain and snowfall, with no inlet streams"
    ],
    trivia: [
      "The water is so pure and deep it appears an intense blue",
      "Phantom Ship, a rock formation, looks like a ghost ship",
      "The Old Man of the Lake, a tree stump, has been floating vertically for over 100 years"
    ]
  },
  {
    id: "cuyahoga-valley",
    name: "Cuyahoga Valley National Park",
    state: "Ohio",
    established: "2000",
    description: "Cuyahoga Valley follows the winding Cuyahoga River, featuring waterfalls, rolling hills, and the Ohio & Erie Canal Towpath Trail.",
    imageQuery: "cuyahoga valley waterfall",
    lat: 41.24,
    lng: -81.55,
    facts: [
      "Located between Cleveland and Akron, Ohio",
      "Preserves 33,000 acres along 22 miles of the Cuyahoga River",
      "Home to Brandywine Falls, a 65-foot waterfall"
    ],
    trivia: [
      "One of the few national parks with a scenic railroad running through it",
      "Cuyahoga River was so polluted in 1969 it caught fire, spurring environmental action",
      "Contains over 125 miles of hiking trails"
    ]
  },
  {
    id: "death-valley",
    name: "Death Valley National Park",
    state: "California, Nevada",
    established: "1994",
    description: "Death Valley is the hottest, driest, and lowest national park, featuring extreme desert landscapes, colorful badlands, and historic mining sites.",
    imageQuery: "death valley sand dunes",
    lat: 36.24,
    lng: -116.82,
    facts: [
      "Largest national park in the contiguous United States at 3.4 million acres",
      "Holds the world record for hottest temperature: 134°F in 1913",
      "Badwater Basin is the lowest point in North America at 282 feet below sea level"
    ],
    trivia: [
      "Receives less than 2 inches of rainfall annually",
      "Despite its name, supports over 1,000 plant species and numerous animals",
      "Moving rocks at Racetrack Playa leave mysterious trails as they slide across the mud"
    ]
  },
  {
    id: "denali",
    name: "Denali National Park",
    state: "Alaska",
    established: "1917",
    description: "Denali is home to North America's tallest peak, Denali (20,310 feet), and features vast wilderness, tundra, glaciers, and wildlife including grizzly bears and wolves.",
    imageQuery: "denali mountain alaska",
    lat: 63.33,
    lng: -150.50,
    facts: [
      "Denali (formerly Mount McKinley) is North America's highest peak at 20,310 feet",
      "Covers over 6 million acres, larger than the state of New Hampshire",
      "Only 30% of visitors actually see the peak due to cloud cover"
    ],
    trivia: [
      "Name officially changed from Mount McKinley to Denali in 2015",
      "In the native Athabascan language, Denali means 'The High One'",
      "Home to the 'Big Five': grizzly bears, wolves, caribou, moose, and Dall sheep"
    ]
  },
  {
    id: "dry-tortugas",
    name: "Dry Tortugas National Park",
    state: "Florida",
    established: "1992",
    description: "Dry Tortugas is known for Fort Jefferson, pristine coral reefs, and exceptional birdwatching, located 70 miles west of Key West.",
    imageQuery: "dry tortugas fort jefferson",
    lat: 24.63,
    lng: -82.87,
    facts: [
      "Located 70 miles west of Key West, accessible only by boat or seaplane",
      "Fort Jefferson is the largest masonry structure in the Americas",
      "Nearly 99% of the park is water"
    ],
    trivia: [
      "Named 'tortugas' (turtles) by Ponce de León for the sea turtles found there",
      "'Dry' was added to warn sailors of the lack of fresh water",
      "Dr. Samuel Mudd, who treated Lincoln's assassin, was imprisoned at Fort Jefferson"
    ]
  },
  {
    id: "everglades",
    name: "Everglades National Park",
    state: "Florida",
    established: "1947",
    description: "The Everglades is the largest tropical wilderness in the US, a slow-moving river of grass home to rare and endangered species like manatees and American crocodiles.",
    imageQuery: "everglades wetlands",
    lat: 25.32,
    lng: -80.93,
    facts: [
      "Largest tropical wilderness of any kind in the United States",
      "Only place on Earth where alligators and crocodiles coexist",
      "Designated a World Heritage Site, International Biosphere Reserve, and Wetland of International Importance"
    ],
    trivia: [
      "Often described as a 'river of grass' rather than a swamp",
      "Home to 36 threatened or protected species including Florida panthers",
      "Native Americans called it 'Pa-hay-okee' meaning 'grassy water'"
    ]
  },
  {
    id: "gates-arctic",
    name: "Gates of the Arctic National Park",
    state: "Alaska",
    established: "1980",
    description: "Gates of the Arctic is the northernmost national park, entirely north of the Arctic Circle, preserving pristine wilderness without roads or trails.",
    imageQuery: "gates arctic alaska wilderness",
    lat: 67.78,
    lng: -153.30,
    facts: [
      "Second largest national park at 8.4 million acres",
      "Entirely north of the Arctic Circle",
      "No roads, trails, or facilities exist within the park"
    ],
    trivia: [
      "One of the least visited national parks due to its remoteness",
      "Named by conservationist Bob Marshall for peaks resembling gates",
      "Home to caribou, grizzly bears, wolves, and wolverines"
    ]
  },
  {
    id: "gateway-arch",
    name: "Gateway Arch National Park",
    state: "Missouri",
    established: "2018",
    description: "Gateway Arch commemorates the westward expansion of the US with the iconic 630-foot Gateway Arch in St. Louis.",
    imageQuery: "gateway arch st louis",
    lat: 38.63,
    lng: -90.19,
    facts: [
      "The newest and smallest national park at 91 acres",
      "The Gateway Arch is 630 feet tall, the tallest man-made monument in the U.S.",
      "Renamed from Jefferson National Expansion Memorial in 2018"
    ],
    trivia: [
      "Designed by architect Eero Saarinen and completed in 1965",
      "Can sway up to 18 inches in high winds",
      "Takes a 4-minute tram ride to reach the top"
    ]
  },
  {
    id: "glacier",
    name: "Glacier National Park",
    state: "Montana",
    established: "1910",
    description: "Glacier National Park features pristine forests, alpine meadows, rugged mountains, and spectacular lakes, preserving over one million acres of wilderness.",
    imageQuery: "glacier national park montana",
    lat: 48.80,
    lng: -114.00,
    facts: [
      "Preserves over 1 million acres of forests, alpine meadows, and lakes",
      "Home to 25 active glaciers (down from about 150 in 1850)",
      "Part of the world's first International Peace Park with Canada's Waterton Lakes"
    ],
    trivia: [
      "Going-to-the-Sun Road is one of the most scenic drives in America",
      "Home to the rare white-bark pine and grizzly bears",
      "Featured in the movie 'The Shining'"
    ]
  },
  {
    id: "glacier-bay",
    name: "Glacier Bay National Park",
    state: "Alaska",
    established: "1980",
    description: "Glacier Bay protects a unique wilderness of tidewater glaciers, snow-capped mountains, ocean coastlines, and temperate rainforests.",
    imageQuery: "glacier bay alaska",
    lat: 58.50,
    lng: -137.00,
    facts: [
      "Covers 3.3 million acres, larger than Yellowstone",
      "Home to tidewater glaciers that calve icebergs into the sea",
      "The bay was completely covered by ice 250 years ago"
    ],
    trivia: [
      "One of the fastest glacier retreats ever recorded",
      "Humpback whales return each summer to feed",
      "Accessible primarily by boat or plane"
    ]
  },
  {
    id: "grand-canyon",
    name: "Grand Canyon National Park",
    state: "Arizona",
    established: "1919",
    description: "The Grand Canyon showcases nearly two billion years of Earth's geological history through its immense mile-deep gorge carved by the Colorado River.",
    imageQuery: "grand canyon arizona",
    lat: 36.06,
    lng: -112.14,
    facts: [
      "277 miles long, up to 18 miles wide, and over a mile deep",
      "Exposes nearly 2 billion years of Earth's geological history",
      "The Colorado River carved the canyon over millions of years"
    ],
    trivia: [
      "President Theodore Roosevelt called it 'the one great sight every American should see'",
      "Home to the endangered California condor",
      "The Grand Canyon Railway has transported visitors since 1901"
    ]
  },
  {
    id: "grand-teton",
    name: "Grand Teton National Park",
    state: "Wyoming",
    established: "1929",
    description: "Grand Teton features the dramatic Teton Range rising abruptly from Jackson Hole valley, pristine lakes, and abundant wildlife viewing opportunities.",
    imageQuery: "grand teton mountains",
    lat: 43.79,
    lng: -110.68,
    facts: [
      "The Teton Range rises abruptly 7,000 feet from Jackson Hole valley",
      "Grand Teton peak stands at 13,775 feet",
      "Covers 310,000 acres in northwestern Wyoming"
    ],
    trivia: [
      "Named 'Les Trois Tétons' (The Three Teats) by French fur trappers",
      "Home to the historic Mormon Row with iconic barns",
      "One of the best places to view moose, elk, and grizzly bears"
    ]
  },
  {
    id: "great-basin",
    name: "Great Basin National Park",
    state: "Nevada",
    established: "1986",
    description: "Great Basin showcases Nevada's diverse desert and mountain landscapes, ancient bristlecone pines, and Lehman Caves.",
    imageQuery: "great basin bristlecone pine",
    lat: 38.98,
    lng: -114.30,
    facts: [
      "Wheeler Peak rises to 13,063 feet",
      "Home to ancient bristlecone pines, some over 4,000 years old",
      "Lehman Caves feature intricate limestone formations"
    ],
    trivia: [
      "One of the best places for stargazing due to minimal light pollution",
      "Only national park in Nevada",
      "The park has streams that disappear into the ground, never reaching the ocean"
    ]
  },
  {
    id: "great-sand-dunes",
    name: "Great Sand Dunes National Park",
    state: "Colorado",
    established: "2004",
    description: "Great Sand Dunes features the tallest sand dunes in North America, rising 750 feet against the Sangre de Cristo Mountains.",
    imageQuery: "great sand dunes colorado",
    lat: 37.73,
    lng: -105.51,
    facts: [
      "Star Dune is the tallest dune in North America at about 750 feet",
      "Dunes cover about 30 square miles",
      "Sand is recycled by wind from the valley floor"
    ],
    trivia: [
      "Medano Creek appears seasonally at the base of the dunes",
      "Visitors can sandboard or sled down the dunes",
      "The sand can reach 150°F on summer days"
    ]
  },
  {
    id: "great-smoky",
    name: "Great Smoky Mountains National Park",
    state: "North Carolina, Tennessee",
    established: "1934",
    description: "The most visited national park in the US, Great Smoky Mountains features ancient mountains, diverse plant and animal life, and remnants of Southern Appalachian culture.",
    imageQuery: "great smoky mountains",
    lat: 35.68,
    lng: -83.53,
    facts: [
      "Most visited national park with over 12 million visitors annually",
      "Home to over 19,000 documented species",
      "Clingmans Dome is the highest point at 6,643 feet"
    ],
    trivia: [
      "Named for the smoke-like fog that often blankets the mountains",
      "One of the last remaining habitats for synchronous fireflies",
      "Over 90 historic structures preserved including log cabins and grist mills"
    ]
  },
  {
    id: "guadalupe-mountains",
    name: "Guadalupe Mountains National Park",
    state: "Texas",
    established: "1972",
    description: "Guadalupe Mountains contains Guadalupe Peak, the highest point in Texas, and El Capitan, along with the world's most extensive Permian fossil reef.",
    imageQuery: "guadalupe mountains texas",
    lat: 31.92,
    lng: -104.87,
    facts: [
      "Guadalupe Peak is the highest point in Texas at 8,751 feet",
      "Contains the world's most extensive Permian fossil reef",
      "McKittrick Canyon features stunning fall foliage"
    ],
    trivia: [
      "The ancient reef formed in a tropical sea 265 million years ago",
      "One of the least visited national parks",
      "No water or food services available in the park"
    ]
  },
  {
    id: "haleakala",
    name: "Haleakalā National Park",
    state: "Hawaii",
    established: "1916",
    description: "Haleakalā protects the Haleakalā volcano on Maui, featuring a massive crater, unique silversword plants, and rare Hawaiian wildlife.",
    imageQuery: "haleakala crater hawaii",
    lat: 20.72,
    lng: -156.17,
    facts: [
      "Haleakalā volcano summit stands at 10,023 feet",
      "The crater is 7 miles across, 2 miles wide, and 2,600 feet deep",
      "Name means 'House of the Sun' in Hawaiian"
    ],
    trivia: [
      "Sunrise from the summit is one of the park's most popular experiences",
      "Home to the endangered nēnē (Hawaiian goose)",
      "The silversword plant grows only here and can live for 50 years before flowering once and dying"
    ]
  },
  {
    id: "hawaii-volcanoes",
    name: "Hawaiʻi Volcanoes National Park",
    state: "Hawaii",
    established: "1916",
    description: "Hawaiʻi Volcanoes encompasses two active volcanoes, Kīlauea and Mauna Loa, showcasing volcanic landscapes and native Hawaiian ecosystems.",
    imageQuery: "hawaii volcanoes lava",
    lat: 19.38,
    lng: -155.20,
    facts: [
      "Home to Kīlauea, one of the world's most active volcanoes",
      "Mauna Loa is the world's largest active volcano",
      "Lava has been flowing continuously from Kīlauea since 1983"
    ],
    trivia: [
      "The park grows larger each year as lava reaches the ocean and cools",
      "Thurston Lava Tube is a 500-year-old cave visitors can walk through",
      "In Hawaiian culture, Pele is the goddess of volcanoes and fire"
    ]
  },
  {
    id: "hot-springs",
    name: "Hot Springs National Park",
    state: "Arkansas",
    established: "1921",
    description: "Hot Springs preserves historic bathhouses and thermal springs in the city of Hot Springs, Arkansas.",
    imageQuery: "hot springs arkansas bathhouse",
    lat: 34.51,
    lng: -93.05,
    facts: [
      "Smallest national park at 5,550 acres",
      "Only national park located in an urban area",
      "Thermal springs produce 700,000 gallons of 143°F water daily"
    ],
    trivia: [
      "Bathhouse Row features eight historic bathhouses from the early 1900s",
      "Nicknamed 'The American Spa'",
      "Protected as a federal reservation in 1832, before Yellowstone"
    ]
  },
  {
    id: "indiana-dunes",
    name: "Indiana Dunes National Park",
    state: "Indiana",
    established: "2019",
    description: "Indiana Dunes features diverse ecosystems along Lake Michigan's southern shore, including beaches, dunes, wetlands, and forests.",
    imageQuery: "indiana dunes lake michigan",
    lat: 41.65,
    lng: -87.05,
    facts: [
      "One of the newest national parks, designated in 2019",
      "Mount Baldy is a 126-foot living dune that moves",
      "Contains 15 miles of Lake Michigan shoreline"
    ],
    trivia: [
      "Home to over 1,100 flowering plant species",
      "Chicago's skyline is visible from the dunes",
      "The area was saved from industrialization by decades of conservation efforts"
    ]
  },
  {
    id: "isle-royale",
    name: "Isle Royale National Park",
    state: "Michigan",
    established: "1940",
    description: "Isle Royale is a remote island wilderness in Lake Superior, known for its wolf and moose populations and backcountry hiking.",
    imageQuery: "isle royale michigan lake",
    lat: 47.99,
    lng: -88.55,
    facts: [
      "Least visited national park in the lower 48 states",
      "Accessible only by boat or seaplane",
      "Closed from November to mid-April due to weather"
    ],
    trivia: [
      "Home to the longest-running predator-prey study (wolves and moose) since 1958",
      "The island is actually an archipelago with over 400 smaller islands",
      "Moose swam to the island around 1900; wolves crossed an ice bridge in 1949"
    ]
  },
  {
    id: "joshua-tree",
    name: "Joshua Tree National Park",
    state: "California",
    established: "1994",
    description: "Joshua Tree is where two distinct desert ecosystems meet, characterized by unique Joshua trees, rugged rock formations, and stunning starry skies.",
    imageQuery: "joshua tree desert",
    lat: 33.87,
    lng: -115.90,
    facts: [
      "Where the Mojave and Colorado deserts meet",
      "Joshua trees can live for 150 years or more",
      "Named by Mormon settlers who thought the trees resembled the biblical Joshua"
    ],
    trivia: [
      "One of the best places in Southern California for rock climbing",
      "Designated an International Dark Sky Park for stargazing",
      "Popular with musicians; U2 named an album after the park"
    ]
  },
  {
    id: "katmai",
    name: "Katmai National Park",
    state: "Alaska",
    established: "1980",
    description: "Katmai is famous for its brown bears fishing for salmon at Brooks Falls and the Valley of Ten Thousand Smokes.",
    imageQuery: "katmai bears salmon",
    lat: 58.50,
    lng: -155.00,
    facts: [
      "Home to over 2,000 brown bears, one of the largest protected populations",
      "Brooks Falls is the most popular bear viewing spot",
      "The 1912 Novarupta eruption created the Valley of Ten Thousand Smokes"
    ],
    trivia: [
      "The volcanic eruption was the largest of the 20th century",
      "Four million sockeye salmon run through the park annually",
      "Fat Bear Week celebrates the bears preparing for hibernation"
    ]
  },
  {
    id: "kenai-fjords",
    name: "Kenai Fjords National Park",
    state: "Alaska",
    established: "1980",
    description: "Kenai Fjords features the Harding Icefield, tidewater glaciers, fjords, and abundant marine wildlife including whales and puffins.",
    imageQuery: "kenai fjords glacier",
    lat: 59.92,
    lng: -149.65,
    facts: [
      "Harding Icefield covers over 700 square miles",
      "Over 38 glaciers flow from the icefield",
      "Named for the fjords carved by glaciers"
    ],
    trivia: [
      "Exit Glacier is the only part accessible by road",
      "Boat tours offer views of calving glaciers and marine wildlife",
      "Puffins, orcas, and humpback whales are commonly spotted"
    ]
  },
  {
    id: "kings-canyon",
    name: "Kings Canyon National Park",
    state: "California",
    established: "1940",
    description: "Kings Canyon features deep canyons, massive sequoia groves, roaring rivers, and the vast wilderness of the High Sierra.",
    imageQuery: "kings canyon california",
    lat: 36.80,
    lng: -118.55,
    facts: [
      "Kings Canyon is one of the deepest canyons in North America",
      "Grant Grove contains General Grant Tree, the second-largest tree on Earth",
      "Administered jointly with Sequoia National Park"
    ],
    trivia: [
      "John Muir called Kings Canyon 'a rival to Yosemite'",
      "The canyon is deeper than the Grand Canyon in some places",
      "Cedar Grove offers spectacular granite cliffs similar to Yosemite"
    ]
  },
  {
    id: "kobuk-valley",
    name: "Kobuk Valley National Park",
    state: "Alaska",
    established: "1980",
    description: "Kobuk Valley contains the Great Kobuk Sand Dunes and preserves the migration route of Arctic caribou herds.",
    imageQuery: "kobuk valley sand dunes",
    lat: 67.55,
    lng: -159.28,
    facts: [
      "Great Kobuk Sand Dunes cover 25 square miles",
      "Located 25 miles north of the Arctic Circle",
      "No roads or trails; accessible only by air taxi"
    ],
    trivia: [
      "Half a million caribou migrate through twice annually",
      "Sand temperatures can reach 100°F in summer",
      "Archaeological sites show 12,000 years of human history"
    ]
  },
  {
    id: "lake-clark",
    name: "Lake Clark National Park",
    state: "Alaska",
    established: "1980",
    description: "Lake Clark features stunning turquoise lakes, active volcanoes, and abundant wildlife in a pristine wilderness accessible only by air or water.",
    imageQuery: "lake clark alaska",
    lat: 60.97,
    lng: -153.42,
    facts: [
      "Accessible only by air or water",
      "Lake Clark is 42 miles long and over 1,000 feet deep",
      "Contains two active volcanoes: Mount Redoubt and Mount Iliamna"
    ],
    trivia: [
      "One of the least visited national parks",
      "Supports all five species of Pacific salmon",
      "Brown bears gather at river mouths during salmon runs"
    ]
  },
  {
    id: "lassen-volcanic",
    name: "Lassen Volcanic National Park",
    state: "California",
    established: "1916",
    description: "Lassen Volcanic showcases all four types of volcanoes, along with hydrothermal sites including boiling springs and fumaroles.",
    imageQuery: "lassen volcanic california",
    lat: 40.49,
    lng: -121.51,
    facts: [
      "Only place on Earth with all four types of volcanoes",
      "Lassen Peak last erupted from 1914-1917",
      "Contains numerous hydrothermal features"
    ],
    trivia: [
      "Bumpass Hell is the largest hydrothermal area in the park",
      "Named after pioneer Peter Lassen",
      "Snow can fall any month of the year at higher elevations"
    ]
  },
  {
    id: "mammoth-cave",
    name: "Mammoth Cave National Park",
    state: "Kentucky",
    established: "1941",
    description: "Mammoth Cave is the world's longest known cave system with over 400 miles explored, featuring diverse cave formations and ecosystems.",
    imageQuery: "mammoth cave formations",
    lat: 37.19,
    lng: -86.10,
    facts: [
      "World's longest cave system with over 400 miles explored",
      "More cave passages are discovered regularly",
      "Designated a World Heritage Site and International Biosphere Reserve"
    ],
    trivia: [
      "Native Americans explored the caves 4,000 years ago",
      "Used for saltpeter mining during the War of 1812",
      "Home to rare blind cave fish and eyeless cave beetles"
    ]
  },
  {
    id: "mesa-verde",
    name: "Mesa Verde National Park",
    state: "Colorado",
    established: "1906",
    description: "Mesa Verde protects some of the best-preserved Ancestral Puebloan cliff dwellings in North America, offering glimpses into ancient cultures.",
    imageQuery: "mesa verde cliff dwellings",
    lat: 37.18,
    lng: -108.49,
    facts: [
      "First national park created to preserve cultural heritage",
      "Contains over 5,000 archaeological sites",
      "Cliff Palace is the largest cliff dwelling in North America"
    ],
    trivia: [
      "Ancestral Puebloans lived here from 600 to 1300 CE",
      "The mesa was mysteriously abandoned around 1300 CE, possibly due to drought",
      "Cowboys rediscovered the cliff dwellings in 1888"
    ]
  },
  {
    id: "mount-rainier",
    name: "Mount Rainier National Park",
    state: "Washington",
    established: "1899",
    description: "Dominated by the iconic 14,410-foot Mount Rainier volcano, this park features old-growth forests, subalpine meadows filled with wildflowers, and glaciers.",
    imageQuery: "mount rainier wildflowers",
    lat: 46.85,
    lng: -121.75,
    facts: [
      "Fifth oldest national park, established in 1899",
      "Mount Rainier stands at 14,410 feet",
      "Has the largest single-peak glacier system in the contiguous U.S."
    ],
    trivia: [
      "Paradise area receives an average of 640 inches of snow annually",
      "The mountain is an active volcano that last erupted 1,000 years ago",
      "Wildflower displays in subalpine meadows peak in July and August"
    ]
  },
  {
    id: "new-river-gorge",
    name: "New River Gorge National Park",
    state: "West Virginia",
    established: "2020",
    description: "New River Gorge preserves a rugged landscape carved by the ancient New River, offering whitewater rafting and rock climbing.",
    imageQuery: "new river gorge bridge",
    lat: 37.97,
    lng: -81.07,
    facts: [
      "Newest national park, designated in 2020",
      "The New River is one of the oldest rivers in the world",
      "New River Gorge Bridge is one of the highest in the United States at 876 feet"
    ],
    trivia: [
      "Despite its name, the New River is ancient, possibly millions of years old",
      "Bridge Day allows BASE jumping from the bridge annually",
      "World-class whitewater rafting and rock climbing destination"
    ]
  },
  {
    id: "north-cascades",
    name: "North Cascades National Park",
    state: "Washington",
    established: "1968",
    description: "North Cascades features jagged peaks, more than 300 glaciers, and pristine wilderness in the Pacific Northwest's dramatic mountain landscape.",
    imageQuery: "north cascades mountains",
    lat: 48.70,
    lng: -121.20,
    facts: [
      "Contains more than 300 glaciers, the most of any U.S. park outside Alaska",
      "Over 300 miles of trails through rugged wilderness",
      "Home to rare wildlife including gray wolves and grizzly bears"
    ],
    trivia: [
      "Often called the 'American Alps'",
      "One of the least visited national parks despite stunning scenery",
      "The North Cascades Highway (State Route 20) is one of America's most scenic drives"
    ]
  },
  {
    id: "olympic",
    name: "Olympic National Park",
    state: "Washington",
    established: "1938",
    description: "Olympic National Park encompasses three distinct ecosystems: rugged Pacific coastline, temperate rainforests, and glacier-capped mountains.",
    imageQuery: "olympic national park",
    lat: 47.80,
    lng: -123.60,
    facts: [
      "Contains three distinct ecosystems: coast, mountains, and rainforest",
      "Hoh Rain Forest receives up to 170 inches of rain annually",
      "Mount Olympus rises 7,980 feet"
    ],
    trivia: [
      "One of the wettest places in the continental United States",
      "Home to the rare Roosevelt elk",
      "Over 95% of the park is designated wilderness"
    ]
  },
  {
    id: "petrified-forest",
    name: "Petrified Forest National Park",
    state: "Arizona",
    established: "1962",
    description: "Petrified Forest features one of the world's largest concentrations of petrified wood, along with ancient petroglyphs and painted desert badlands.",
    imageQuery: "petrified forest arizona",
    lat: 34.91,
    lng: -109.78,
    facts: [
      "Contains one of the world's largest concentrations of petrified wood",
      "Petrified trees are over 200 million years old",
      "Painted Desert features colorful badlands"
    ],
    trivia: [
      "Petrified wood is actually quartz crystal, not wood",
      "Ancient petroglyphs date back over 2,000 years",
      "Removal of petrified wood is illegal and punishable by law"
    ]
  },
  {
    id: "pinnacles",
    name: "Pinnacles National Park",
    state: "California",
    established: "2013",
    description: "Pinnacles preserves the remains of an ancient volcano, with towering rock spires, talus caves, and California condor habitat.",
    imageQuery: "pinnacles national park california",
    lat: 36.48,
    lng: -121.16,
    facts: [
      "One of the newest national parks, designated in 2013",
      "Formed from an ancient volcanic eruption",
      "Home to the endangered California condor"
    ],
    trivia: [
      "The rock formations moved 195 miles from their origin on the San Andreas Fault",
      "Talus caves provide cool refuge and are home to bats",
      "Popular destination for rock climbing"
    ]
  },
  {
    id: "redwood",
    name: "Redwood National Park",
    state: "California",
    established: "1968",
    description: "Redwood preserves nearly half of all remaining coastal redwoods, the tallest trees on Earth, along with pristine coastline and prairies.",
    imageQuery: "redwood trees california",
    lat: 41.30,
    lng: -124.00,
    facts: [
      "Protects 45% of all remaining old-growth coast redwoods",
      "Hyperion, the world's tallest known tree at 379.7 feet, is hidden in the park",
      "Redwoods can live for over 2,000 years"
    ],
    trivia: [
      "Exact location of Hyperion is kept secret to protect it",
      "Redwoods grow from seeds smaller than a tomato seed",
      "The trees are resistant to fire, insects, and disease"
    ]
  },
  {
    id: "rocky-mountain",
    name: "Rocky Mountain National Park",
    state: "Colorado",
    established: "1915",
    description: "Rocky Mountain National Park features majestic mountain peaks, alpine lakes, and diverse wildlife across varied ecosystems from montane to alpine tundra.",
    imageQuery: "rocky mountain national park",
    lat: 40.40,
    lng: -105.58,
    facts: [
      "Contains 77 peaks above 12,000 feet",
      "Trail Ridge Road reaches 12,183 feet, highest paved road in the U.S.",
      "Over 350 miles of trails"
    ],
    trivia: [
      "Home to bighorn sheep, elk, moose, and marmots",
      "About one-third of the park is above treeline",
      "The Continental Divide runs through the park"
    ]
  },
  {
    id: "saguaro",
    name: "Saguaro National Park",
    state: "Arizona",
    established: "1994",
    description: "Saguaro protects the iconic saguaro cactus and Sonoran Desert landscape near Tucson, Arizona.",
    imageQuery: "saguaro cactus arizona",
    lat: 32.25,
    lng: -111.17,
    facts: [
      "Divided into two districts on either side of Tucson",
      "Saguaros can grow up to 40 feet tall and live for 200 years",
      "Arms don't begin growing until the cactus is 50-70 years old"
    ],
    trivia: [
      "Saguaros can weigh over 2,000 pounds when full of water",
      "The white flowers are Arizona's state flower",
      "Gila woodpeckers carve nest holes that are later used by other species"
    ]
  },
  {
    id: "sequoia",
    name: "Sequoia National Park",
    state: "California",
    established: "1890",
    description: "Sequoia protects groves of giant sequoia trees, including General Sherman, the world's largest tree by volume, along with high Sierra wilderness.",
    imageQuery: "sequoia trees giant",
    lat: 36.43,
    lng: -118.68,
    facts: [
      "Second national park, established in 1890",
      "General Sherman Tree is the largest living tree by volume",
      "Giant sequoias can live for over 3,000 years"
    ],
    trivia: [
      "Mount Whitney, the highest peak in the contiguous U.S., is located in the park",
      "Giant sequoias grow naturally only on the western slopes of the Sierra Nevada",
      "Moro Rock provides 360-degree views from the top"
    ]
  },
  {
    id: "shenandoah",
    name: "Shenandoah National Park",
    state: "Virginia",
    established: "1935",
    description: "Shenandoah encompasses part of the Blue Ridge Mountains with scenic Skyline Drive, cascading waterfalls, and diverse wildlife habitats.",
    imageQuery: "shenandoah mountains virginia",
    lat: 38.53,
    lng: -78.35,
    facts: [
      "Skyline Drive runs 105 miles along the crest of the Blue Ridge Mountains",
      "Contains over 500 miles of hiking trails, including 101 miles of the Appalachian Trail",
      "Home to over 200 species of birds"
    ],
    trivia: [
      "The park was established on land previously inhabited by mountain communities",
      "Fall foliage draws millions of visitors annually",
      "Black bears are common; over 1,000 live in the park"
    ]
  },
  {
    id: "theodore-roosevelt",
    name: "Theodore Roosevelt National Park",
    state: "North Dakota",
    established: "1978",
    description: "Theodore Roosevelt preserves the badlands where Teddy Roosevelt ranched, featuring colorful rock formations and wild bison herds.",
    imageQuery: "theodore roosevelt badlands",
    lat: 46.97,
    lng: -103.45,
    facts: [
      "Named after President Theodore Roosevelt, an avid conservationist",
      "Divided into three units: South Unit, North Unit, and Elkhorn Ranch",
      "Home to a herd of 200-300 wild bison"
    ],
    trivia: [
      "Roosevelt credited his time in the Dakota badlands with shaping his conservation policies",
      "Wild horses roam freely throughout the park",
      "The Little Missouri River carved the colorful badlands"
    ]
  },
  {
    id: "virgin-islands",
    name: "Virgin Islands National Park",
    state: "U.S. Virgin Islands",
    established: "1956",
    description: "Virgin Islands protects tropical ecosystems, pristine beaches, and coral reefs on the island of St. John.",
    imageQuery: "virgin islands beach caribbean",
    lat: 18.34,
    lng: -64.73,
    facts: [
      "Covers about 60% of the island of St. John",
      "Protects 5,650 acres of underwater coral reefs and seagrass beds",
      "Trunk Bay's underwater snorkel trail is one of the first of its kind"
    ],
    trivia: [
      "Most of the park was donated by Laurance Rockefeller",
      "Petroglyphs at Reef Bay date back to pre-Columbian times",
      "Former sugar plantation ruins dot the landscape"
    ]
  },
  {
    id: "voyageurs",
    name: "Voyageurs National Park",
    state: "Minnesota",
    established: "1975",
    description: "Voyageurs preserves the waterways once traveled by French-Canadian fur traders, with interconnected lakes and northern forests.",
    imageQuery: "voyageurs national park lake",
    lat: 48.50,
    lng: -92.88,
    facts: [
      "Named after French-Canadian fur traders called voyageurs",
      "Over 40% of the park is water",
      "Accessible primarily by boat"
    ],
    trivia: [
      "Contains 655 miles of shoreline",
      "Excellent destination for houseboat vacations",
      "Northern lights are visible during winter months"
    ]
  },
  {
    id: "white-sands",
    name: "White Sands National Park",
    state: "New Mexico",
    established: "2019",
    description: "White Sands features the world's largest gypsum dune field, creating a surreal landscape of brilliant white sand.",
    imageQuery: "white sands new mexico",
    lat: 32.78,
    lng: -106.17,
    facts: [
      "One of the newest national parks, designated in 2019",
      "World's largest gypsum dune field covering 275 square miles",
      "Dunes can shift up to 30 feet per year"
    ],
    trivia: [
      "Gypsum is rarely found as sand because it dissolves in water",
      "Sledding on the dunes is a popular activity",
      "Surrounded by White Sands Missile Range; park occasionally closes for missile tests"
    ]
  },
  {
    id: "wind-cave",
    name: "Wind Cave National Park",
    state: "South Dakota",
    established: "1903",
    description: "Wind Cave features one of the world's longest caves known for its boxwork formations, along with mixed-grass prairie above ground.",
    imageQuery: "wind cave south dakota",
    lat: 43.57,
    lng: -103.48,
    facts: [
      "Seventh oldest national park, established in 1903",
      "Over 150 miles of cave passages explored",
      "Contains 95% of the world's discovered boxwork formations"
    ],
    trivia: [
      "Named for barometric winds at the entrance that can exceed 70 mph",
      "Sacred site for Lakota people as the place where humans emerged to the surface",
      "Above ground, the park protects one of the few remaining natural mixed-grass prairies"
    ]
  },
  {
    id: "wrangell-st-elias",
    name: "Wrangell-St. Elias National Park",
    state: "Alaska",
    established: "1980",
    description: "Wrangell-St. Elias is the largest national park, featuring towering mountains, massive glaciers, and vast wilderness.",
    imageQuery: "wrangell st elias alaska",
    lat: 61.00,
    lng: -142.00,
    facts: [
      "Largest national park at 13.2 million acres, six times the size of Yellowstone",
      "Contains 9 of the 16 highest peaks in the United States",
      "Malaspina Glacier is larger than the state of Rhode Island"
    ],
    trivia: [
      "Designated a UNESCO World Heritage Site",
      "Contains the largest concentration of glaciers in North America",
      "Historic Kennecott Copper Mine operated from 1911-1938"
    ]
  },
  {
    id: "yellowstone",
    name: "Yellowstone National Park",
    state: "Wyoming, Montana, Idaho",
    established: "1872",
    description: "America's first national park, Yellowstone is famous for its geothermal features including Old Faithful geyser, colorful hot springs, dramatic canyons, and abundant wildlife.",
    imageQuery: "yellowstone geyser",
    lat: 44.60,
    lng: -110.50,
    facts: [
      "World's first national park, established in 1872",
      "Contains over half of the world's active geysers",
      "Sits atop the Yellowstone Caldera, the largest supervolcano in North America"
    ],
    trivia: [
      "Old Faithful erupts about every 90 minutes",
      "Grand Prismatic Spring is the largest hot spring in the U.S.",
      "Home to the largest concentration of mammals in the lower 48 states"
    ]
  },
  {
    id: "yosemite",
    name: "Yosemite National Park",
    state: "California",
    established: "1890",
    description: "Yosemite National Park is a stunning natural reserve in California known for its majestic granite cliffs, waterfalls, diverse ecosystems, and iconic landmarks like El Capitan and Half Dome.",
    imageQuery: "yosemite valley",
    lat: 37.83,
    lng: -119.50,
    facts: [
      "Yosemite Falls is the tallest waterfall in North America at 2,425 feet",
      "El Capitan is a 3,000-foot granite monolith popular with climbers",
      "Half Dome rises nearly 5,000 feet above the valley floor"
    ],
    trivia: [
      "Ansel Adams' photography helped make Yosemite famous worldwide",
      "John Muir's advocacy led to Yosemite becoming a national park",
      "Alex Honnold completed the first free solo climb of El Capitan in 2017"
    ]
  },
  {
    id: "zion",
    name: "Zion National Park",
    state: "Utah",
    established: "1919",
    description: "Zion is known for its dramatic red and white Navajo sandstone cliffs, narrow slot canyons, and unique desert and riparian habitats.",
    imageQuery: "zion national park",
    lat: 37.30,
    lng: -113.05,
    facts: [
      "Zion Canyon's walls reach up to 2,000 feet high",
      "The Virgin River carved the canyon over millions of years",
      "Elevation ranges from 3,666 to 8,726 feet"
    ],
    trivia: [
      "The Narrows is one of the most famous hikes, wading through the Virgin River",
      "Angels Landing is one of America's most dangerous hikes",
      "Named 'Zion' by Mormon settlers meaning 'place of peace and refuge'"
    ]
  }
];
