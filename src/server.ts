function login(username: string): boolean {
    const user = {
        name: "Vishal",
    };
    return user["name"] === username;
}

login("Vishal");
