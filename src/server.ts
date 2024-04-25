function login(username: string): boolean {
    const user = {
        name: "Vishal",
    };
    return user.name === username;
}
// husky and lint-staged setup
login("Vishal");
