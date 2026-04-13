const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_TCheqKNUA',
      userPoolClientId: '797pd77i4irdf3oavq17glgvr0',
      loginWith: { email: true },
    }
  }
};

export default awsConfig;
